import React, { useState } from 'react';
import { FileCheck2, Send, ShieldAlert, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VerificationReport } from '../../types';
import { assertPermission } from '../../utils/permissions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const GenerateReportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    applications,
    documents,
    claims,
    complianceRules,
    addVerificationReport,
    currentRole,
    addToast,
    logAuditAction,
  } = useApp();

  const [selectedAppId, setSelectedAppId] = useState(applications[0]?.id || '');
  const [reportType, setReportType] = useState<VerificationReport['reportType']>('Scrutiny Committee Summary');
  const [verdict, setVerdict] = useState<VerificationReport['verdict']>('Recommended for Approval');

  if (!isOpen) return null;

  const targetApp = applications.find((a) => a.id === selectedAppId) || applications[0];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetApp) return;

    // RBAC Guard: Final EoA requires Level 3/4 Clearance
    if (reportType === 'Final Extension of Approval (EoA) Order') {
      const perm = assertPermission(currentRole, 'canGenerateFinalEoA');
      if (!perm.allowed) {
        addToast(
          'warning',
          perm.reason || 'You do not have clearance to grant Final EoA orders. Switch to Senior Director role.',
          'Clearance Restriction'
        );
        return;
      }
    }

    const reportNo = `AICTE/${targetApp.region.split('(')[1]?.slice(0, 3) || 'RO'}/${reportType.includes('EoA') ? 'EOA' : 'SCRUTINY'}/2025/${Math.floor(10000 + Math.random() * 90000)}`;

    // Calculate actual metrics from stored data
    const targetDocs = documents.filter(
      (d) => d.applicationId === targetApp.id || d.applicationId === targetApp.pid
    );
    const targetClaims = claims.filter(
      (c) => c.applicationId === targetApp.id || c.pid === targetApp.pid
    );

    const totalAudited = Math.max(38, complianceRules.length, targetDocs.length + targetClaims.length);
    const criticalViolations =
      targetApp.deficienciesCount +
      targetDocs.filter((d) => d.verificationStatus === 'Tampering / Forgery Suspected').length;
    const minorDeficits = targetDocs.filter(
      (d) => d.verificationStatus === 'Deficiency Flagged' || d.verificationStatus === 'Officer Manual Review Needed'
    ).length;
    const normsSatisfied = Math.max(0, totalAudited - criticalViolations - minorDeficits);

    const newReport: VerificationReport = {
      id: `REP-${Date.now().toString().slice(-4)}`,
      reportNumber: reportNo,
      applicationId: targetApp.id,
      institutionName: targetApp.institutionName,
      pid: targetApp.pid,
      generatedDate: new Date().toISOString().split('T')[0],
      reportType,
      verdict,
      evaluatorName: currentRole.split('(')[0].trim(),
      evaluatorDesignation: currentRole,
      summaryMetrics: {
        totalNormsChecked: totalAudited,
        normsSatisfied,
        minorDeficiencies: minorDeficits,
        criticalViolations,
      },
    };

    addVerificationReport(newReport);
    addToast('success', `Official order ${reportNo} generated successfully.`, 'Order Sealed');
    logAuditAction(
      `Generated Regulatory Report: ${reportType} (${verdict})`,
      targetApp.applicationNumber,
      'STATUS_CHANGE',
      verdict.includes('Not Recommended') ? 'Critical' : 'Info'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in-50">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-teal-700 to-teal-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-teal-200" />
            <h3 className="text-base font-bold text-white">Generate Official Scrutiny Report</h3>
          </div>
          <button onClick={onClose} className="p-1 text-teal-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="p-5 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Select Institution Application *
            </label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.institutionName} ({a.applicationNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Report Type *
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="Scrutiny Committee Summary">Scrutiny Committee Summary</option>
              <option value="Deficiency Assessment Report">Deficiency Assessment Report</option>
              <option value="Expert Visit Committee (EVC) Findings">Expert Visit Committee (EVC) Findings</option>
              <option value="Final Extension of Approval (EoA) Order">Final Extension of Approval (EoA) Order</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Regulatory Verdict *
            </label>
            <select
              value={verdict}
              onChange={(e) => setVerdict(e.target.value as any)}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="Recommended for Approval">Recommended for Approval</option>
              <option value="Approved with 15-day Rectification">Approved with 15-day Rectification</option>
              <option value="Escalated to Standing Appellate Committee">Escalated to Standing Appellate Committee</option>
              <option value="Not Recommended (Severe Deficiencies)">Not Recommended (Severe Deficiencies)</option>
            </select>
          </div>

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
              <span>Generate & Sign Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
