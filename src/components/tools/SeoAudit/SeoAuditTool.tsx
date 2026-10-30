import React, { useEffect, useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Download,
  Mail,
  Bookmark,
  FormInput,
  ShieldAlert,
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
  Save
} from 'lucide-react';
import { AuditReportData } from '../../../lib/audit/rules';
import { trackEvent, sanitizeUrlForAnalytics } from '../../../lib/analytics';
import { WorkspaceGmailModal } from '../../workspace/WorkspaceGmailModal';
import { WorkspaceKeepModal } from '../../workspace/WorkspaceKeepModal';
import { WorkspaceFormsModal } from '../../workspace/WorkspaceFormsModal';
import { AdSlot } from '../../layout/AdSlot';
import { getSupabase } from '../../../lib/supabase';
import { saveUserAudit } from '../../../lib/data';
import { API_CONFIGURED, apiEndpoint, checkApiHealth } from '../../../lib/apiClient';

export const SeoAuditTool: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [savedToCloud, setSavedToCloud] = useState(false);

  // Modals
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [keepModalOpen, setKeepModalOpen] = useState(false);
  const [formsModalOpen, setFormsModalOpen] = useState(false);

  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>(
    API_CONFIGURED ? 'checking' : 'offline'
  );

  useEffect(() => {
    let mounted = true;
    if (!API_CONFIGURED) return;
    checkApiHealth().then(online => {
      if (mounted) setApiStatus(online ? 'online' : 'offline');
    });
    return () => { mounted = false; };
  }, []);

  const apiUnavailable = !API_CONFIGURED || apiStatus !== 'online';

  const sampleUrls = [
    'https://example.com',
    'https://wikipedia.org',
    'https://developer.mozilla.org'
  ];

  const handleRunAudit = async (urlToTest?: string) => {
    const target = (urlToTest || urlInput).trim();
    if (apiUnavailable) {
      setError('SEO Audit server is not connected or is currently unreachable. Please try again when the server is online.');
      return;
    }
    if (!target) {
      setError('Please enter a website URL to audit.');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);
    setSavedToCloud(false);

    trackEvent('audit_started', { domain: sanitizeUrlForAnalytics(target) });

    try {
      const response = await fetch(apiEndpoint('/api/audit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ url: target })
      });

      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Audit API returned an unexpected response. Check the backend URL and server configuration.');
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server returned error (${response.status})`);
      }

      if (typeof data.score !== 'number' || !Array.isArray(data.checks)) {
        throw new Error('Audit server returned an invalid report. Please contact support.');
      }
      setReport(data);
      trackEvent('audit_completed', {
        domain: sanitizeUrlForAnalytics(target),
        score: data.score
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      trackEvent('audit_failed', {
        domain: sanitizeUrlForAnalytics(target),
        error: msg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopySnippet = (snippet: string, checkId: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetId(checkId);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleCopySummary = () => {
    if (!report) return;
    const summaryText = `RankNova SEO Audit: ${report.targetUrl}
Score: ${report.score}/100 (Grade ${report.grade})
Status: ${report.statusCode} • Response Time: ${report.fetchDurationMs}ms
Passed: ${report.summary.passed} | Warnings: ${report.summary.warnings} | Errors: ${report.summary.errors}

Key Action Items:
${report.checks
  .filter(c => c.status !== 'passed')
  .map(c => `- [${c.status.toUpperCase()}] ${c.title}: ${c.recommendation || c.message}`)
  .join('\n')}

Audit run by RankNova SEO Suite. Scores are custom rule-based diagnostics and not official Google metrics.`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    trackEvent('report_downloaded', { type: 'summary_copy' });
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranknova-seo-audit-${new URL(report.targetUrl).hostname}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    trackEvent('report_downloaded', { type: 'json_download' });
  };

  const handleSaveToSupabase = async () => {
    if (!report) return;
    try {
      const { data: { user }, error } = await getSupabase().auth.getUser();
      if (error || !user) {
        alert('Sign in with Google to save your audit securely.');
        return;
      }
      await saveUserAudit({
        userId: user.id, url: report.targetUrl, score: report.score,
        passedCount: report.summary.passed, warningsCount: report.summary.warnings,
        errorsCount: report.summary.errors, title: report.metadata.title || '',
        metaDescription: report.metadata.description || ''
      });
      setSavedToCloud(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit could not be saved.');
    }
  };

  // Filter checks
  const filteredChecks = report?.checks.filter(c => {
    const matchCat = selectedCategory === 'all' || c.category === selectedCategory;
    const matchStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchCat && matchStatus;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {apiUnavailable && (
        <div role="status" className="max-w-3xl mx-auto rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {!API_CONFIGURED
            ? 'SEO Audit requires a connected API backend. The site owner has not configured the Cloud Run URL yet; live audits are temporarily unavailable.'
            : apiStatus === 'checking'
            ? 'Checking connection to the real SEO audit server...'
            : 'SEO Audit server is currently unavailable. No sample scores or fabricated results will be displayed.'}
          {API_CONFIGURED && apiStatus === 'offline' && (
            <button type="button" className="ml-2 underline font-semibold" onClick={() => {
              setApiStatus('checking');
              checkApiHealth().then(online => setApiStatus(online ? 'online' : 'offline'));
            }}>Retry connection</button>
          )}
        </div>
      )}
      {/* Tool Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Technical On-Page Diagnostics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Website SEO Audit Checker
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Deep, rule-based diagnostic audit. Evaluates title tags, meta descriptions, canonical directives, mobile viewport, H1–H3 hierarchy, image alt text, Open Graph, and Schema.org structured data.
        </p>
      </div>

      {/* Audit Input Form */}
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunAudit();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://yourwebsite.com/page"
              className="w-full bg-slate-50/50 border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              aria-label="Website URL to audit"
            />
          </div>
          <button
            type="submit"
            disabled={loading || apiUnavailable}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Auditing Page...</span>
              </>
            ) : (
              <>
                <span>Analyze Website</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Examples */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
          <span>Try an example:</span>
          {sampleUrls.map((sample) => (
            <button
              key={sample}
              type="button"
              disabled={apiUnavailable}
              onClick={() => {
                setUrlInput(sample);
                handleRunAudit(sample);
              }}
              className="text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-md border border-slate-200 font-medium transition-colors cursor-pointer"
            >
              {sample.replace('https://', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="max-w-3xl mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold text-rose-900">Audit Request Blocked or Failed</strong>
            <p className="text-xs text-rose-700">{error}</p>
            <p className="text-[11px] text-rose-600">
              Note: RankNova enforces strict SSRF protections. Internal network destinations, private IPs, and localhost targets are blocked by design.
            </p>
          </div>
        </div>
      )}

      {/* Audit Report Presentation */}
      {report && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Top Overview Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              {/* Score Gauge */}
              <div className="flex items-center gap-5">
                <div
                  className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center font-bold border-2 ${
                    report.score >= 85
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : report.score >= 65
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-rose-50 border-rose-300 text-rose-700'
                  }`}
                >
                  <span className="text-3xl font-black">{report.score}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Grade {report.grade}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      HTTP {report.statusCode} OK
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {report.fetchDurationMs}ms TTFB
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 max-w-xl truncate" title={report.targetUrl}>
                    {report.targetUrl}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Proprietary RankNova On-Page Score (0–100) • {new Date(report.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <button
                  onClick={handleCopySummary}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
                <button
                  onClick={handleSaveToSupabase}
                  disabled={savedToCloud}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    savedToCloud
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {savedToCloud ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savedToCloud ? 'Saved to Cloud' : 'Save to Cloud'}</span>
                </button>
              </div>
            </div>

            {/* Google Workspace Integration Bar */}
            <div className="pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/80 -mx-6 -mb-6 p-6 rounded-b-2xl border-t border-slate-100">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Google Workspace Actions
                </span>
                <p className="text-[11px] text-slate-500">
                  Export report, create client intake surveys, or sync checklists with permission from your Google account.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setGmailModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-red-600" />
                  <span>Email Report via Gmail</span>
                </button>
                <button
                  onClick={() => setKeepModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                  <span>Add Checklist to Keep</span>
                </button>
                <button
                  onClick={() => setFormsModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FormInput className="w-3.5 h-3.5 text-purple-600" />
                  <span>Client Intake Form</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {report.categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(selectedCategory === cat.category ? 'all' : cat.category)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedCategory === cat.category
                    ? 'bg-blue-50 border-blue-500 text-slate-900 shadow-sm ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500 truncate mb-1">
                  {cat.name}
                </div>
                <div className="text-xl font-bold text-slate-900 mb-2">{cat.score}%</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <span className="text-emerald-600">{cat.passedCount} pass</span>
                  <span>•</span>
                  <span className="text-rose-600">{cat.errorCount} fail</span>
                </div>
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: `All (${report.checks.length})` },
                { id: 'error', label: `Errors (${report.summary.errors})`, color: 'text-rose-600' },
                { id: 'warning', label: `Warnings (${report.summary.warnings})`, color: 'text-amber-600' },
                { id: 'passed', label: `Passed (${report.summary.passed})`, color: 'text-emerald-600' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedStatus === tab.id
                      ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-300'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${tab.color || ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500">
              Showing {filteredChecks.length} of {report.checks.length} checks
            </div>
          </div>

          {/* Check Items List */}
          <div className="space-y-4">
            {filteredChecks.map((check) => {
              const isPassed = check.status === 'passed';
              const isWarning = check.status === 'warning';
              const isError = check.status === 'error';

              return (
                <div
                  key={check.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isPassed
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : isWarning
                      ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                      : 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isPassed && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                        {isError && <XCircle className="w-5 h-5 text-rose-600" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{check.title}</h3>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isPassed
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isWarning
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {check.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{check.message}</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-mono font-semibold text-slate-500">
                        {check.pointsEarned} / {check.maxPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* Recommendation and fix snippet */}
                  {check.recommendation && (
                    <div className="mt-4 pt-3 border-t border-slate-200/80 pl-8 space-y-2">
                      <div className="text-xs text-amber-900 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Recommended Action:</span> {check.recommendation}
                      </div>
                      {check.codeSnippet && (
                        <div className="relative mt-2">
                          <pre className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto shadow-sm">
                            <code>{check.codeSnippet}</code>
                          </pre>
                          <button
                            onClick={() => handleCopySnippet(check.codeSnippet!, check.id)}
                            className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedSnippetId === check.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Transparent limitations card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Diagnostic Transparency & Non-Executed Checks</span>
            </div>
            <p className="leading-relaxed">
              To guarantee zero SSRF exposure and lightweight resource usage, the following checks were omitted by design:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {report.unsupportedChecks.map((item, idx) => (
                <li key={idx}>
                  <strong className="text-slate-800">{item.name}:</strong> {item.reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Compliant separated Ad slot */}
          <AdSlot slotId="seo-audit-results" />
        </div>
      )}

      {/* Workspace Modals */}
      {report && (
        <>
          <WorkspaceGmailModal
            isOpen={gmailModalOpen}
            onClose={() => setGmailModalOpen(false)}
            report={report}
          />
          <WorkspaceKeepModal
            isOpen={keepModalOpen}
            onClose={() => setKeepModalOpen(false)}
            report={report}
          />
        </>
      )}
      <WorkspaceFormsModal
        isOpen={formsModalOpen}
        onClose={() => setFormsModalOpen(false)}
      />
    </div>
  );
};
