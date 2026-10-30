import { getSupabase } from './supabase';

export interface CmsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  content: string;
  published: boolean;
  author: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  adSenseClientId: string;
  adsEnabled: boolean;
  cmpEnabled: boolean;
  toolsEnabled: { seoAudit: boolean; metaGenerator: boolean; schemaGenerator: boolean };
}

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'RankNova', adSenseClientId: '', adsEnabled: false,
  cmpEnabled: false,
  toolsEnabled: { seoAudit: true, metaGenerator: true, schemaGenerator: true }
};

function articleFromRow(row: any): CmsArticle {
  return {
    id: row.id, slug: row.slug, title: row.title,
    excerpt: row.excerpt || '', category: row.category || 'SEO Guide',
    content: row.content || '', published: Boolean(row.published),
    author: row.author || 'RankNova', createdAt: row.created_at
  };
}

export async function getPublicArticles(): Promise<CmsArticle[]> {
  const { data, error } = await getSupabase().from('articles')
    .select('id,slug,title,excerpt,category,content,published,author,created_at')
    .eq('published', true).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(articleFromRow);
}

export async function getPublishedArticle(slug: string): Promise<CmsArticle | null> {
  const { data, error } = await getSupabase().from('articles')
    .select('id,slug,title,excerpt,category,content,published,author,created_at')
    .eq('slug', slug).eq('published', true).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? articleFromRow(data) : null;
}

export async function getAdminArticles(): Promise<CmsArticle[]> {
  const { data, error } = await getSupabase().from('articles')
    .select('id,slug,title,excerpt,content,category,published,author,created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(articleFromRow);
}

export async function addArticle(input: Omit<CmsArticle, 'id' | 'createdAt'>): Promise<CmsArticle> {
  const { data, error } = await getSupabase().from('articles').insert({
    slug: input.slug, title: input.title, excerpt: input.excerpt,
    content: input.content, category: input.category, published: input.published,
    author: input.author
  }).select('id,slug,title,excerpt,content,category,published,author,created_at').single();
  if (error || !data) throw new Error(error?.message || 'Unable to create the article.');
  return articleFromRow(data);
}

export async function getAdminFeedback(): Promise<ContactMessage[]> {
  const { data, error } = await getSupabase().from('feedback')
    .select('id,name,email,subject,message,created_at').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(row => ({
    id: row.id, name: row.name, email: row.email,
    subject: row.subject, message: row.message, createdAt: row.created_at
  }));
}

export async function deleteFeedback(id: string): Promise<void> {
  const { error } = await getSupabase().from('feedback').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function sendFeedback(input: {
  name: string; email: string; subject: string; message: string;
}): Promise<void> {
  const { error } = await getSupabase().rpc('submit_ranknova_feedback', {
    p_name: input.name, p_email: input.email,
    p_subject: input.subject, p_message: input.message
  });
  if (error) throw new Error(error.message);
}

export async function getAdminSettings(): Promise<SiteSettings> {
  const { data, error } = await getSupabase().from('site_settings')
    .select('site_name,adsense_client_id,ads_enabled,cmp_enabled,tools_enabled')
    .eq('id', 'config').maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return DEFAULT_SETTINGS;
  return {
    siteName: data.site_name || DEFAULT_SETTINGS.siteName,
    adSenseClientId: data.adsense_client_id || '',
    adsEnabled: Boolean(data.ads_enabled),
    cmpEnabled: Boolean(data.cmp_enabled),
    toolsEnabled: { ...DEFAULT_SETTINGS.toolsEnabled, ...(data.tools_enabled || {}) }
  };
}

export async function saveAdminSettings(settings: SiteSettings): Promise<void> {
  const { error } = await getSupabase().from('site_settings').upsert({
    id: 'config', site_name: settings.siteName,
    adsense_client_id: settings.adSenseClientId,
    ads_enabled: settings.adsEnabled, cmp_enabled: settings.cmpEnabled,
    tools_enabled: settings.toolsEnabled, updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function saveUserAudit(params: {
  userId: string; url: string; score: number; passedCount: number;
  warningsCount: number; errorsCount: number; title: string; metaDescription: string;
}): Promise<void> {
  const { error } = await getSupabase().from('audit_history').insert({
    user_id: params.userId,
    url: params.url, score: params.score,
    passed_count: params.passedCount,
    warnings_count: params.warningsCount, errors_count: params.errorsCount,
    title: params.title, meta_description: params.metaDescription
  });
  if (error) throw new Error(error.message);
}
