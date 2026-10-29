import React, { useState } from 'react';
import { FormInput, ExternalLink, X, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { createAuditIntakeForm, getCachedAccessToken, googleWorkspaceSignIn } from '../../lib/workspace';

interface WorkspaceFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceFormsModal: React.FC<WorkspaceFormsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [formTitle, setFormTitle] = useState('Website SEO Audit Request Intake');
  const [loading, setLoading] = useState(false);
  const [formResult, setFormResult] = useState<{
    formUrl?: string;
    responderUri?: string;
    formId?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!getCachedAccessToken()) {
        await googleWorkspaceSignIn();
      }

      const res = await createAuditIntakeForm(formTitle);
      if (res.success && res.formUrl) {
        setFormResult({
          formUrl: res.formUrl,
          responderUri: res.responderUri,
          formId: res.formId
        });
      } else {
        setError(res.error || 'Failed to create Google Form.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <FormInput className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Create Client Intake Form</h3>
            <p className="text-xs text-slate-500">Google Workspace Google Forms API</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {formResult ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-slate-900 mb-1">
                  Google Form Created Successfully!
                </strong>
                Your intake form includes preset questions for website URL, target keywords, and primary SEO objectives.
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Public Respondent Link (Share with Clients)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={formResult.responderUri}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                  />
                  <a
                    href={formResult.responderUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 flex-shrink-0 shadow-xs cursor-pointer"
                  >
                    View <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Editor Link (Google Forms)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={formResult.formUrl}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                  />
                  <a
                    href={formResult.formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1 flex-shrink-0 cursor-pointer"
                  >
                    Edit <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateForm} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Form Title
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <span className="font-bold text-slate-800">Preset Questions Automatically Added:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                <li>Target website URL</li>
                <li>Top 3 priority keywords & competitors</li>
                <li>Core SEO goals (Technical fix, SERP CTR, Schema, or Full growth)</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? 'Generating Form in Workspace...' : 'Create Form'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
