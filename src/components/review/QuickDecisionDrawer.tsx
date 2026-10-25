import React, { useState } from 'react';
import {
  AlertTriangle,
  Building,
  CheckCircle,
  FileCheck,
  FileText,
  HelpCircle,
  Scale,
  Send,
  Shield,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReviewQueueItem } from '../../types';
import { Badge } from '../common/Badge';
import { assertPermission } from '../../utils/permissions';

interface Props {
  item: ReviewQueueItem;
  onClose: () => void;
}

export const QuickDecisionDrawer: React.FC<Props> = ({ item, onClose }) => {
  const { updateApplicationStatus, addToast, logAuditAction, currentRole } = useApp();
  const [decision, setDecision] = useState<'accept' | 'clarification' | 'evc' | 'hearing'>('accept');
  const [officerNotes, setOfficerNotes] = useState('');

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();

    if (decision === 'accept') {
      const perm = assertPermission(currentRole, 'canApproveEoA');
      if (!perm.allowed) {
        addToast(
          'warning',
          perm.reason || 'Clearance Denied: Only Senior Director or Appellate Authority can grant final EoA approval.',
          'Insufficient Clearance'
        );
        return;
      }
      updateApplicationStatus(item.applicationId, 'Approved / EoA Issued', officerNotes || 'Approved in Review Queue');
      addToast('success', `Approved Extension of Approval for ${item.institutionName}.`, 'Decision Executed');
    } else if (decision === 'clarification') {
      updateApplicationStatus(item.applicationId, 'Deficiencies Communicated', officerNotes || 'Clarification required on documents');
      addToast('warning', `Clarification notice issued for ${item.institutionName}.`, 'Clarification Dispatched');
    } else if (decision === 'evc') {
      updateApplicationStatus(item.applicationId, 'EVC Physical Inspection', officerNotes || 'EVC ground inspection ordered');
      addToast('info', `EVC physical inspection ordered for ${item.institutionName}.`, 'EVC Scheduled');
    } else if (decision === 'hearing') {
      updateApplicationStatus(item.applicationId, 'Hearing / Appellate', officerNotes || 'Referred to Standing Appellate Committee');
      addToast('warning', `Referred to Standing Appellate Committee (SAC).`, 'Hearing Scheduled');
    }

    logAuditAction(`Review Queue Decision Executed: ${decision.toUpperCase()}`, item.applicationId, 'STATUS_CHANGE', 'Info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in-50">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#071626] p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-teal-400 font-semibold bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                {item.id}
              </span>
              <Badge variant={item.priority === 'Urgent' ? 'danger' : 'warning'} size="xs">
                {item.priority} Priority
              </Badge>
            </div>
            <h3 className="text-base font-bold text-white mt-1 leading-snug">
              {item.institutionName}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              PID: {item.pid} • {item.region}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleExecute} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Flag Reason */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400">
              Queue Flagging Trigger:
            </span>
            <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {item.flagReason}
            </p>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Regulatory Action *
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  decision === 'accept'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  checked={decision === 'accept'}
                  onChange={() => setDecision('accept')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Clear & Recommend for Approval (EoA)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Deficiencies resolved or within permissible relaxation thresholds.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  decision === 'clarification'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  checked={decision === 'clarification'}
                  onChange={() => setDecision('clarification')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Issue 14-Day Deficiency Communication Notice
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Notify institution to resubmit compliant documents or proof of rectification.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  decision === 'evc'
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-1 ring-purple-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  checked={decision === 'evc'}
                  onChange={() => setDecision('evc')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Order Expert Visit Committee (EVC) On-Site Physical Inspection
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Depute 3-member expert team for physical verification of labs, land, and ramps.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  decision === 'hearing'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  checked={decision === 'hearing'}
                  onChange={() => setDecision('hearing')}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Escalate to Standing Appellate Committee (SAC) Hearing
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Summon institution authorities with original registers and records.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Officer Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Statutory Scrutiny Notes & Justification
            </label>
            <textarea
              rows={3}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="Record officer remarks to accompany this regulatory order..."
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Record Decision</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
