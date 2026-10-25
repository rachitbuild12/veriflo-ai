import React, { useState } from 'react';
import { AlertTriangle, Calendar, FileText, Send, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DeficiencyNotice } from '../../types';

interface Props {
  applicationId: string;
  onClose: () => void;
}

export const DeficiencyNoticeModal: React.FC<Props> = ({ applicationId, onClose }) => {
  const { applications, complianceRules, issueDeficiencyNotice } = useApp();
  const app = applications.find((a) => a.id === applicationId);

  const [selectedRuleCode, setSelectedRuleCode] = useState(complianceRules[0]?.clauseCode || 'APH-FSR-01');
  const [severity, setSeverity] = useState<'Critical' | 'Major' | 'Minor'>('Major');
  const [issueDescription, setIssueDescription] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(14);

  if (!app) return null;

  const selectedRule = complianceRules.find((r) => r.clauseCode === selectedRuleCode);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription.trim()) return;

    const complianceDeadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const notice: Omit<DeficiencyNotice, 'id' | 'issuedDate'> = {
      clauseCode: selectedRuleCode,
      category: selectedRule?.category || 'General Regulatory Compliance',
      issueDescription: issueDescription.trim(),
      severity,
      complianceDeadline,
      status: 'Pending Response',
    };

    issueDeficiencyNotice(app.id, notice);
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
                Issue Official Deficiency Notice
              </h3>
              <p className="text-xs text-amber-100 font-mono">
                AICTE APH Rule Enforcement • {app.applicationNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-amber-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleDispatch} className="p-5 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Select APH Compliance Clause
            </label>
            <select
              value={selectedRuleCode}
              onChange={(e) => setSelectedRuleCode(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
            >
              {complianceRules.map((r) => (
                <option key={r.id} value={r.clauseCode}>
                  [{r.clauseCode}] {r.title} ({r.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Deficiency Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Critical">Critical (Mandatory Disqualification)</option>
                <option value="Major">Major (Intake Reduction Risk)</option>
                <option value="Minor">Minor (Rectification Required)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Compliance Window
              </label>
              <select
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value={7}>7 Calendar Days (Urgent)</option>
                <option value={14}>14 Calendar Days (Standard)</option>
                <option value={21}>21 Calendar Days (Extended)</option>
                <option value={30}>30 Calendar Days (Appellate)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Detailed Findings & Non-Compliance Description *
            </label>
            <textarea
              required
              rows={4}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Cite the exact deficiency observed during document scrutiny (e.g., Cadre ratio deficit of 2 Associate Professors in Computer Science, or missing municipal Form B Fire NOC)..."
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
            />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px]">
            <strong>Notice Impact:</strong> Dispatches automated notification to institution principal and locks EoA approval until satisfactory compliance documents or hearing order is recorded.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Deficiency Notice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
