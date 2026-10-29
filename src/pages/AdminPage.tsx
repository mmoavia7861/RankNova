import React, { useState, useEffect } from 'react';
import {
  Settings,
  FileText,
  MessageSquare,
  Activity,
  Plus,
  CheckCircle2,
  Trash2,
  Lock,
  Save
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType, isUserAdmin, ADMIN_EMAIL } from '../lib/firebase';
import { googleWorkspaceSignIn } from '../lib/workspace';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published: boolean;
  author: string;
  createdAt: string;
}

interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'settings' | 'feedback'>('overview');
  const [loading, setLoading] = useState(false);

  // Settings State
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'RankNova',
    adSenseClientId: 'ca-pub-0000000000000000',
    adsEnabled: false,
    cmpEnabled: true,
    toolsEnabled: {
      seoAudit: true,
      metaGenerator: true,
      schemaGenerator: true
    }
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Articles State
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newCategory, setNewCategory] = useState('On-Page SEO');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');

  // Feedback State
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  const user = auth.currentUser;
  const isAdmin = user && isUserAdmin(user.email);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch site settings
      const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
      if (settingsDoc.exists()) {
        setSiteSettings(settingsDoc.data() as any);
      }

      // 2. Fetch feedback
      const feedbackSnap = await getDocs(collection(db, 'feedback'));
      const fbList: FeedbackItem[] = [];
      feedbackSnap.forEach(d => {
        fbList.push({ id: d.id, ...(d.data() as any) });
      });
      setFeedbacks(fbList);

      // 3. Fetch articles
      const articleSnap = await getDocs(collection(db, 'articles'));
      const artList: ArticleItem[] = [];
      articleSnap.forEach(d => {
        artList.push({ id: d.id, ...(d.data() as any) });
      });
      setArticles(artList);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'config'), {
        ...siteSettings,
        updatedAt: new Date().toISOString()
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/config');
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) return;

    try {
      const docRef = await addDoc(collection(db, 'articles'), {
        title: newTitle.trim(),
        slug: newSlug.trim().toLowerCase().replace(/\s+/g, '-'),
        category: newCategory.trim(),
        excerpt: newExcerpt.trim(),
        content: newContent.trim(),
        published: true,
        author: user?.displayName || 'RankNova Editor',
        createdAt: new Date().toISOString()
      });

      setArticles([
        {
          id: docRef.id,
          title: newTitle,
          slug: newSlug,
          category: newCategory,
          excerpt: newExcerpt,
          published: true,
          author: user?.displayName || 'RankNova Editor',
          createdAt: new Date().toISOString()
        },
        ...articles
      ]);

      setNewTitle('');
      setNewSlug('');
      setNewExcerpt('');
      setNewContent('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'articles');
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Delete this feedback submission?')) return;
    try {
      await deleteDoc(doc(db, 'feedback', id));
      setFeedbacks(feedbacks.filter(f => f.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `feedback/${id}`);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 text-slate-700 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Admin Authentication Required</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          This portal is restricted to the platform owner (<code>{ADMIN_EMAIL}</code>). Please authenticate with your verified Google account.
        </p>
        <button
          onClick={() => googleWorkspaceSignIn()}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
        >
          Sign in with Authorized Google Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Owner Panel
            </span>
            <span className="text-xs text-slate-500">{user.email}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            RankNova Admin & CMS Control
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-xs">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'articles', label: 'Articles & CMS', icon: FileText },
            { id: 'settings', label: 'Ad & Site Config', icon: Settings },
            { id: 'feedback', label: `Inquiries (${feedbacks.length})`, icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Published Tools</span>
              <div className="text-2xl font-bold text-slate-900">3 Active</div>
              <span className="text-[11px] text-emerald-700 font-medium">Audit, Meta, Schema</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Total Articles</span>
              <div className="text-2xl font-bold text-slate-900">{articles.length + 4}</div>
              <span className="text-[11px] text-blue-700 font-medium">Guides & Tutorials</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Contact Submissions</span>
              <div className="text-2xl font-bold text-slate-900">{feedbacks.length}</div>
              <span className="text-[11px] text-purple-700 font-medium">Stored in Firestore</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">AdSense Readiness</span>
              <div className="text-2xl font-bold text-emerald-700">Compliant</div>
              <span className="text-[11px] text-slate-500 font-medium">CMP & Separation Active</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 text-xs text-slate-600 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Production Operational Status</h3>
            <p className="leading-relaxed">
              Express full-stack server running on Google Cloud Run with Vite middleware. Outbound audit requests are protected against SSRF via DNS A/AAAA resolution and IP validation.
            </p>
          </div>
        </div>
      )}

      {/* ARTICLES CMS TAB */}
      {activeTab === 'articles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Create New SEO Guide</span>
            </h3>

            <form onSubmit={handleCreateArticle} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Article Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => {
                    setNewTitle(e.target.value);
                    if (!newSlug) {
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Core Web Vitals Optimization Guide"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  value={newSlug}
                  onChange={e => setNewSlug(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Summary / Excerpt</label>
                <textarea
                  rows={2}
                  value={newExcerpt}
                  onChange={e => setNewExcerpt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Content</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Publish Article
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Published Dynamic Articles</h3>
            {articles.length === 0 ? (
              <p className="text-xs text-slate-500">
                No custom articles published in Firestore yet. Pre-rendered core guides are active in the Guides hub.
              </p>
            ) : (
              <div className="space-y-3">
                {articles.map((art) => (
                  <div
                    key={art.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{art.title}</div>
                      <div className="text-slate-500">/guides/{art.slug} • {art.category}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-semibold border border-emerald-200">
                      Published
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Site & Monetization Configuration</h3>
            {settingsSaved && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Saved to Firestore!
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Google AdSense Publisher Client ID
              </label>
              <input
                type="text"
                value={siteSettings.adSenseClientId}
                onChange={e => setSiteSettings({ ...siteSettings, adSenseClientId: e.target.value })}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Keep disabled until your AdSense site application is approved.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <strong className="text-slate-900 block font-bold">Enable Live Ad Slots</strong>
                <span className="text-slate-600">Display publisher ads across tool result containers</span>
              </div>
              <input
                type="checkbox"
                checked={siteSettings.adsEnabled}
                onChange={e => setSiteSettings({ ...siteSettings, adsEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <strong className="text-slate-900 block font-bold">Google-Certified CMP (EEA/UK/CH)</strong>
                <span className="text-slate-600">Enforce IAB TCF 2.2 consent modal for European visitors</span>
              </div>
              <input
                type="checkbox"
                checked={siteSettings.cmpEnabled}
                onChange={e => setSiteSettings({ ...siteSettings, cmpEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Site Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INQUIRIES / FEEDBACK TAB */}
      {activeTab === 'feedback' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">User Feedback & Inquiries Inbox</h3>
          {feedbacks.length === 0 ? (
            <p className="text-xs text-slate-500">No contact messages received yet.</p>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900">
                      {fb.name} &lt;{fb.email}&gt;
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">
                        {new Date(fb.createdAt).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDeleteFeedback(fb.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Delete inquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-blue-700 font-semibold">{fb.subject}</div>
                  <p className="text-slate-700 whitespace-pre-wrap">{fb.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
