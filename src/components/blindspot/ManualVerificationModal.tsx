import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileText,
  HelpCircle,
  Paperclip,
  Shield,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import { DocumentClaim, ManualReviewInput } from './blindSpotModel';
import { useApp } from '../../context/AppContext';

interface Props {
  isOpen: boolean;
  claim: DocumentClaim | null;
  onClose: () => void;
  onVerified?: () => void;
}

export const ManualVerificationModal: React.FC<Props> = ({
  isOpen,
  claim,
  onClose,
  onVerified,
}) => {
  const { currentRole, performManualClaimVerification, addToast } = useApp();

  const [reviewerName, setReviewerName] = useState('Dr. Vivek Swarup');
  const [reviewerRole, setReviewerRole] = useState<string>(currentRole || 'Regional Scrutiny Officer (WRO)');
  const [outcomeStatus, setOutcomeStatus] = useState<
    'Verified through authorized source' | 'Inconclusive' | 'Manual verification required'
  >('Verified through authorized source');
  const [evidenceReference, setEvidenceReference] = useState('');
  const [evidenceAttachmentName, setEvidenceAttachmentName] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmedStatutory, setConfirmedStatutory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !claim) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewerName.trim()) {
      addToast('error', 'Please enter your officer name/identity.', 'Validation Error');
      return;
    }
    if (!reviewerRole.trim()) {
      addToast('error', 'Please specify your official scrutiny role.', 'Validation Error');
      return;
    }
    if (!evidenceReference.trim()) {
      addToast('error', 'Please enter a valid evidence reference or dispatch serial.', 'Validation Error');
      return;
    }
    if (!notes.trim() || notes.trim().length < 8) {
      addToast('error', 'Please provide detailed audit notes (minimum 8 characters).', 'Validation Error');
      return;
    }
    if (!confirmedStatutory) {
      addToast('warning', 'Please acknowledge the official statutory verification statement.', 'Acknowledgment Required');
      return;
    }

    setIsSubmitting(true);

    const input: ManualReviewInput = {
      reviewerName,
      reviewerRole,
      outcomeStatus,
      evidenceReference,
      evidenceAttachmentName: evidenceAttachmentName.trim() || undefined,
      notes,
    };

    const res = performManualClaimVerification(claim.id, input);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
      if (onVerified) onVerified();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-50">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Manual Officer Verification Workflow
              </h2>
              <p className="text-[11px] text-slate-400">
                Authorized regulatory determination for unverified or flagged claims
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Target Claim Details Card */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{claim.institutionName} • PID: {claim.pid}</span>
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                {claim.status}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {claim.claimType}
              </h4>
              <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold mt-0.5">
                Observed Claim: "{claim.claimedValue}"
              </p>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Source: {claim.sourceDocumentName} {claim.pageNumber ? `(Page ${claim.pageNumber})` : ''}</span>
            </div>

            {claim.statusReason && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-slate-200 dark:border-slate-700 leading-relaxed">
                <strong>Current Verification Context:</strong> {claim.statusReason}
              </p>
            )}
          </div>

          {/* Reviewer Identity Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reviewer Officer Name *
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. Dr. Vivek Swarup"
                required
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Scrutiny Designation *
              </label>
              <input
                type="text"
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
                placeholder="e.g. Regional Scrutiny Officer (WRO)"
                required
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Outcome Status Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Verification Outcome Determination *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  outcomeStatus === 'Verified through authorized source'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="Verified through authorized source"
                  checked={outcomeStatus === 'Verified through authorized source'}
                  onChange={() => setOutcomeStatus('Verified through authorized source')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-[11px]">Authorized Verification</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Independent proof confirmed</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  outcomeStatus === 'Inconclusive'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="Inconclusive"
                  checked={outcomeStatus === 'Inconclusive'}
                  onChange={() => setOutcomeStatus('Inconclusive')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="font-bold text-[11px]">Inconclusive</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Conflicting / absent proof</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  outcomeStatus === 'Manual verification required'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="Manual verification required"
                  checked={outcomeStatus === 'Manual verification required'}
                  onChange={() => setOutcomeStatus('Manual verification required')}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-[11px]">Further Audit Req.</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Physical EVC visit needed</div>
                </div>
              </label>
            </div>
          </div>

          {/* Evidence Reference Citation */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Authorized Evidence Citation / Reference Number *
            </label>
            <input
              type="text"
              value={evidenceReference}
              onChange={(e) => setEvidenceReference(e.target.value)}
              placeholder="e.g. CFO-UP/VERIF/2025/DISPATCH-9912 or Physical File Vol-3 p.42"
              required
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Must identify the official physical letter, government seal serial, or registrar liaison dispatch.
            </p>
          </div>

          {/* Optional Attachment Memo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Evidence Attachment / Supporting Memo (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={evidenceAttachmentName}
                onChange={(e) => setEvidenceAttachmentName(e.target.value)}
                placeholder="e.g. Liaison_Officer_Attested_Copy_2025.pdf"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <span className="p-2 text-slate-400 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                <Paperclip className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Audit Justification Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Officer Scrutiny Notes & Verification Rationale *
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail how the verification was conducted (e.g. Telephonic liaison with issuing registrar, inspection of physical dispatch register, cross-referencing certified university ledger)..."
              required
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed"
            />
          </div>

          {/* Statutory Acknowledgment Checkbox */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedStatutory}
                onChange={(e) => setConfirmedStatutory(e.target.checked)}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                I solemnly certify that I have verified the independent physical or authorized documentary evidence. This entry constitutes a formal regulatory determination under AICTE Approval Process Handbook (APH) rules.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Record Regulatory Determination</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
