import React, { useState } from 'react';
import { Bookmark, CheckSquare, Copy, Check, ExternalLink, X } from 'lucide-react';
import { AuditReportData } from '../../lib/audit/rules';

interface WorkspaceKeepModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReportData;
}

export const WorkspaceKeepModal: React.FC<WorkspaceKeepModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Extract actionable items
  const actionItems = report.checks
    .filter(c => c.status !== 'passed')
    .map(c => `[ ] ${c.title}: ${c.recommendation || c.message}`);

  const noteTitle = `SEO Action Plan: ${new URL(report.targetUrl).hostname} (RankNova)`;
  const noteBody = `${noteTitle}\nScore: ${report.score}/100 • Generated: ${new Date().toLocaleDateString()}\n\nAction Items:\n${actionItems.join('\n')}\n\n[ ] Re-run RankNova SEO Audit after fixes are deployed`;

  const handleCopyNote = () => {
    navigator.clipboard.writeText(noteBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openGoogleKeep = () => {
    window.open('https://keep.google.com/', '_blank');
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
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Save Actions to Google Keep</h3>
            <p className="text-xs text-slate-500">Sync audit recommendations to your Keep notes</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Export your {actionItems.length} optimization action items formatted as a ready-to-paste Google Keep checklist note.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-800 max-h-48 overflow-y-auto mb-4 whitespace-pre-wrap shadow-inner">
          {noteBody}
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 mb-4 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-amber-600" />
            Keep Checklist Tip
          </p>
          <p className="text-amber-800 text-[11px] leading-relaxed">
            In Google Keep, click <strong>"New list"</strong> or click the 3 dots on a new note and select <strong>"Show checkboxes"</strong> to convert these into interactive checkable tasks.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCopyNote}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Note'}</span>
          </button>
          <button
            onClick={openGoogleKeep}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Google Keep</span>
          </button>
        </div>
      </div>
    </div>
  );
};
