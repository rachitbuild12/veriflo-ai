import React, { useState } from 'react';
import { AlertTriangle, CheckSquare, Shield, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Props {
  documentId: string;
  onClose: () => void;
}

export const OverrideAlertModal: React.FC<Props> = ({ documentId, onClose }) => {
  const { documents, overrideTamperAlert, currentRole } = useApp();
  const doc = documents.find((d) => d.id === documentId);

  const [justification, setJustification] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!doc) return null;

  const handleOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim() || !confirmed) return;

    overrideTamperAlert(doc.id, justification.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in-50">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-amber-600 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-100" />
            <div>
              <h3 className="text-base font-bold text-white">
                Officer Override of AI Tampering Anomaly
              </h3>
              <p className="text-xs text-amber-100">
                Statutory Regulatory Override Protocol
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-amber-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleOverride} className="p-5 sm:p-6 space-y-4 text-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-semibold">Document Under Review: {doc.fileName}</p>
            <p className="text-[11px]">{doc.institutionName} • AI Confidence: {doc.aiConfidenceScore}%</p>
            <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-400">
              Overriding an AI alert logs an immutable audit trail entry associated with your Digital Key credentials (<strong>{currentRole}</strong>).
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Statutory Justification & Verification Evidence *
            </label>
            <textarea
              required
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Provide exact reasons for overriding AI alert (e.g., Physical original certificate verified with State Fire Department dispatch register ref #88219/2024; font difference caused by scanner DPI resolution, not manual tampering)..."
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
            />
            <span className="text-[11px] text-slate-700 dark:text-slate-300">
              I certify under AICTE regulations that I have verified the authenticity of the primary source document and take official responsibility for this override.
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmed || !justification.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Record Statutory Override</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
