import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Globe,
  Monitor,
  Smartphone,
  Info,
  Layers,
  TrendingUp,
  Search,
  CheckCircle2
} from 'lucide-react';
import { generateMetaSuggestions, estimateTitlePixelWidth } from '../../../lib/meta/generator';
import { trackEvent } from '../../../lib/analytics';
import { AdSlot } from '../../layout/AdSlot';
import { API_CONFIGURED, apiEndpoint } from '../../../lib/apiClient';

export const MetaGeneratorTool: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [topic, setTopic] = useState('');
  const [brand, setBrand] = useState('');
  const [url, setUrl] = useState('');
  const [intent, setIntent] = useState<'informational' | 'commercial' | 'transactional' | 'navigational'>('commercial');

  // Search Grounding toggle
  const [groundingLoading, setGroundingLoading] = useState(false);
  const [groundingError, setGroundingError] = useState('');
  const [groundingData, setGroundingData] = useState<{
    searchSummary: string;
    competitorHeadlines: string[];
    suggestedTitles: string[];
    suggestedDescriptions: string[];
    searchQueries: string[];
    groundingSources: { title: string; url: string }[];
  } | null>(null);

  // Active preview state
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedDesc, setSelectedDesc] = useState('');

  // Copy feedback state
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Generated deterministic variants
  const generatedResult = React.useMemo(() => {
    return generateMetaSuggestions({
      keyword,
      topic,
      brand,
      url,
      intent
    });
  }, [keyword, topic, brand, url, intent]);

  // An edited keyword, topic or intent must not retain suggestions for a previous page.
  useEffect(() => {
    setSelectedTitle('');
    setSelectedDesc('');
    setGroundingData(null);
    setGroundingError('');
  }, [keyword, topic, brand, intent]);

  // Set default selected title & desc if not yet customized
  const currentTitle = keyword.trim() ? (selectedTitle || generatedResult.variants[0]?.title || '') : '';
  const currentDesc = keyword.trim() ? (selectedDesc || generatedResult.variants[0]?.description || '') : '';

  const titleChars = currentTitle.length;
  const titlePixels = estimateTitlePixelWidth(currentTitle);
  const descChars = currentDesc.length;
  const liveSearchUnavailable = !API_CONFIGURED;
  const displayUrl = React.useMemo(() => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.origin : '';
    } catch {
      return '';
    }
  }, [url]);
  const escapeHtml = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const safeTitle = escapeHtml(currentTitle);
  const safeDesc = escapeHtml(currentDesc);
  const safeUrl = escapeHtml(displayUrl && url ? url : '');

  const handleFetchSearchGrounding = async () => {
    if (!keyword.trim() || liveSearchUnavailable) return;
    setGroundingError('');
    setGroundingLoading(true);
    setGroundingData(null);

    try {
      const response = await fetch(apiEndpoint('/api/search-grounding'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, topic, brand })
      });

      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Search API returned unexpected content.');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search analysis is unavailable.');
      if (data.insights) {
        setGroundingData(data.insights);
        if (data.insights.suggestedTitles?.length > 0) {
          setSelectedTitle(data.insights.suggestedTitles[0]);
        }
        if (data.insights.suggestedDescriptions?.length > 0) {
          setSelectedDesc(data.insights.suggestedDescriptions[0]);
        }
      } else {
        setGroundingError('Live search analysis is not configured for this server. The local Meta Generator remains available.');
      }
    } catch (err) {
      console.warn('Grounding fetch failed:', err);
      setGroundingError('Live search analysis is unavailable. You can still use the local Meta Tag Generator.');
    } finally {
      setGroundingLoading(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    if (!keyword.trim()) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    trackEvent('meta_copied', { type });
    setTimeout(() => setCopiedType(null), 2000);
  };

  const fullHtmlSnippet = `<!-- Primary Meta Tags -->
<title>${safeTitle}</title>
<meta name="title" content="${safeTitle}" />
<meta name="description" content="${safeDesc}" />
${safeUrl ? `<link rel="canonical" href="${safeUrl}" />` : ''}

<!-- Open Graph / Social Sharing -->
<meta property="og:type" content="website" />
${safeUrl ? `<meta property="og:url" content="${safeUrl}" />` : ''}
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<!-- Add an authentic Open Graph image URL for your site -->

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
${safeUrl ? `<meta name="twitter:url" content="${safeUrl}" />` : ''}
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>SERP Snippet & CTR Optimizer</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Meta Tag Generator & SERP Preview
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Craft high-CTR title tags and meta descriptions with live desktop & mobile Google search snippet simulation, pixel width counters, and optional Google Search grounding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
              Page Metadata Inputs
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Keyword <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="e.g., website seo checker"
                className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Page Topic or Value Proposition <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Describe what the page offers..."
                className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Name (Optional)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="e.g., RankNova"
                  className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Search Intent
                </label>
                <select
                  value={intent}
                  onChange={e => setIntent(e.target.value as any)}
                  className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  <option value="commercial">Commercial / Solution</option>
                  <option value="informational">Informational / Guide</option>
                  <option value="transactional">Transactional / Tool</option>
                  <option value="navigational">Navigational / Brand</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target URL (Optional for Canonical)
              </label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/page"
                className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Google Search Grounding Section */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Google Search Grounding
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFetchSearchGrounding}
                  disabled={groundingLoading || liveSearchUnavailable || !keyword.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {groundingLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                      <span>Searching Google...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Analyze Live SERP</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {liveSearchUnavailable ? 'Optional search analysis requires the owner to connect the Cloud Run API. The Meta Generator works locally.' : 'Search analysis requires a configured server API and may be unavailable if its provider is not configured.'}
              </p>
            </div>

            {groundingError && <p role="alert" className="text-xs text-rose-700 mt-2">{groundingError}</p>}
            {/* Live Search Grounding Insights */}
            {groundingData && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Live Search Grounding Insights for "{keyword}"</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {groundingData.searchSummary}
                </p>
                {groundingData.competitorHeadlines?.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                      Top Ranking Competitor Patterns:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                      {groundingData.competitorHeadlines.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title Suggestions List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between pb-2 border-b border-slate-100">
              <span>{keyword.trim() ? 'Suggested Title Tags (5 Styles)' : 'Enter a keyword to generate suggestions'}</span>
              <span className="text-[10px] text-slate-500 font-normal">Click to apply</span>
            </h3>

            <div className="space-y-2">
              {(keyword.trim() ? generatedResult.variants : []).map((v, i) => {
                const isSelected = currentTitle === v.title;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedTitle(v.title);
                      setSelectedDesc(v.description);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-slate-900 ring-1 ring-blue-500 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-blue-700">{v.style}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {v.titleChars} chars • ~{v.titlePixels}px
                      </span>
                    </div>
                    <div className="font-medium text-slate-800">{v.title}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live SERP Preview & Markup Export */}
        <div className="lg:col-span-7 space-y-6">
          {/* SERP Simulator Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Approximate Google Search Result Preview</h3>
              </div>

              {/* Device Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Simulated Search Result View */}
            <div className="bg-slate-50/60 border border-slate-200/90 rounded-2xl p-6 select-none text-left">
              {previewDevice === 'desktop' ? (
                /* Desktop Preview */
                <div className="max-w-[600px] space-y-1 font-sans bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  {/* URL / Breadcrumb line */}
                  <div className="flex items-center gap-2 text-[12px] text-[#202124]">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                      {(brand || 'W')[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-[#202124]">{brand || 'Website'}</span>
                    <span className="text-[#5f6368] text-xs">
                      {displayUrl ? displayUrl.replace(/^https?:\/\//, '') : 'your-domain.com'}
                    </span>
                  </div>

                  {/* Title (clickable style) */}
                  <div className="text-[20px] leading-[26px] font-medium text-[#1a0dab] hover:underline cursor-pointer truncate">
                    {currentTitle}
                  </div>

                  {/* Meta description */}
                  <div className="text-[14px] leading-[22px] text-[#4d5156] line-clamp-2">
                    {currentDesc}
                  </div>
                </div>
              ) : (
                /* Mobile Card Preview */
                <div className="max-w-[375px] mx-auto border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-1.5 font-sans">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                      {(brand || 'W')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-[#202124]">{brand || 'Website'}</div>
                      <div className="text-[11px] text-[#5f6368] truncate max-w-[240px]">
                        {displayUrl || 'https://your-domain.com'}
                      </div>
                    </div>
                  </div>

                  <div className="text-[18px] leading-[22px] font-medium text-[#1a0dab] line-clamp-2">
                    {currentTitle}
                  </div>

                  <div className="text-[13px] leading-[18px] text-[#4d5156] line-clamp-3">
                    {currentDesc}
                  </div>
                </div>
              )}
            </div>

            {/* Pixel & Character Metrics Bar */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Title Pixel Width</span>
                  <span
                    className={`font-mono font-bold ${
                      titlePixels <= 580 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    ~{titlePixels}px (rough estimate)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      titlePixels <= 580 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (titlePixels / 600) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500">
                  {titleChars} characters (no fixed Google title limit)
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Description Length</span>
                  <span
                    className={`font-mono font-bold ${
                      descChars >= 120 && descChars <= 160 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {descChars} chars / ~160 ideal
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      descChars >= 120 && descChars <= 160 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (descChars / 160) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500">
                  Display depends on query, device and Google's chosen snippet
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>SERP Accuracy Disclaimer:</strong> This preview is an approximation based on standard Google typography and viewport rendering. Google dynamically adjusts snippets, may display sitelinks, or can rewrite meta descriptions based on individual user queries.
              </span>
            </div>
          </div>

          {/* Copyable HTML Code Output */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Generated HTML & Open Graph Tags</span>
              </h3>

              <button
                onClick={() => handleCopy(fullHtmlSnippet, 'all_tags')}
                disabled={!keyword.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                {copiedType === 'all_tags' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied All Tags!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full &lt;head&gt; Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-64 shadow-inner">
                <code>{fullHtmlSnippet}</code>
              </pre>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleCopy(`<title>${safeTitle}</title>`, 'title_only')}
                disabled={!keyword.trim()}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 cursor-pointer transition-colors"
              >
                {copiedType === 'title_only' ? 'Copied Title!' : 'Copy Title Tag Only'}
              </button>
              <button
                onClick={() =>
                  handleCopy(`<meta name="description" content="${safeDesc}" />`, 'desc_only')
                }
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 cursor-pointer transition-colors"
              >
                {copiedType === 'desc_only' ? 'Copied Description!' : 'Copy Meta Description Only'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compliant Ad Slot */}
      <AdSlot slotId="meta-generator-bottom" />
    </div>
  );
};
