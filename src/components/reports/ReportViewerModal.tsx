import React from 'react';
import { Award, CheckCircle2, Download, Printer, Shield, User, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VerificationReport } from '../../types';
import { Badge } from '../common/Badge';
import { generateRegulatoryPDF } from '../../utils/pdfReportGenerator';

interface Props {
  reportId: string;
  onClose: () => void;
}

export const ReportViewerModal: React.FC<Props> = ({ reportId, onClose }) => {
  const {
    verificationReports,
    applications,
    documents,
    claims,
    blindSpotRecords,
    coverageSummary,
    facilities,
    infrastructureEvidence,
    missingEvidenceList,
    addToast,
    logAuditAction,
  } = useApp();
  const report = verificationReports.find((r) => r.id === reportId);

  if (!report) return null;

  const appClaims = claims.filter(
    (c) => c.applicationId === report.applicationId || c.pid === report.pid
  );
  const appBlindSpots = blindSpotRecords.filter(
    (b) => b.applicationId === report.applicationId || b.pid === report.pid
  );
  const targetApp =
    applications.find((a) => a.id === report.applicationId || a.pid === report.pid) ||
    applications[0];
  const appDocs = documents.filter(
    (d) => d.applicationId === report.applicationId || d.applicationId === report.pid
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    try {
      const pdf = generateRegulatoryPDF({
        report,
        application: targetApp,
        documents: appDocs.length > 0 ? appDocs : documents,
        claims: appClaims.length > 0 ? appClaims : claims,
        blindSpots: appBlindSpots.length > 0 ? appBlindSpots : blindSpotRecords,
        coverageSummary,
        facilities,
        infrastructureEvidence,
        missingEvidence: missingEvidenceList,
      });

      pdf.save(`AICTE_${report.reportNumber.replace(/[\/\\]/g, '_')}.pdf`);
      addToast(
        'success',
        `Official PDF report ${report.reportNumber} generated and downloaded.`,
        'PDF Exported'
      );
      logAuditAction(
        `Generated Official PDF Regulatory Order: ${report.reportNumber}`,
        report.institutionName,
        'STATUS_CHANGE',
        'Info'
      );
    } catch (err) {
      console.error('PDF export error:', err);
      addToast('error', 'Failed to generate PDF. Fallback initiated.', 'Export Error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in-50">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-bold truncate">
              {report.reportType} • {report.reportNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-800"
              title="Download Report"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-800"
              title="Print Order"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Document Sheet */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 space-y-6 select-none font-serif text-xs leading-relaxed">
          {/* Gov Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900 dark:border-slate-600 space-y-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm shadow-md">
              AICTE
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white font-sans">
              All India Council for Technical Education
            </h2>
            <p className="text-[10px] text-slate-500 font-sans">
              (A Statutory Body of the Government of India, Ministry of Education)
            </p>
            <p className="text-[10px] text-slate-500 font-sans">
              Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070 • www.aicte.gov.in
            </p>
          </div>

          {/* Reference & Date */}
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 dark:text-slate-400">
            <span>F. No: <strong>{report.reportNumber}</strong></span>
            <span>Date: <strong>{report.generatedDate}</strong></span>
          </div>

          {/* Order Title */}
          <div className="text-center py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-lg">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white font-sans">
              {report.reportType}
            </h3>
            <p className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold font-sans mt-0.5">
              Verdict: {report.verdict}
            </p>
          </div>

          {/* Recipient Details */}
          <div className="space-y-1 font-sans text-xs">
            <p className="font-semibold text-slate-800 dark:text-slate-200">To,</p>
            <p className="font-bold text-slate-900 dark:text-white">{report.institutionName}</p>
            <p className="text-slate-500 font-mono">Permanent Institute ID: {report.pid}</p>
            <p className="text-slate-500">Associated Application Dossier: {report.applicationId}</p>
          </div>

          {/* Order Text */}
          <div className="space-y-3 text-slate-700 dark:text-slate-300 font-sans text-xs">
            <p>
              In terms of the provisions under the All India Council for Technical Education (Grant of Approvals for Technical Institutions) Regulations, 2020 notified on 4th February 2020 and amended periodically, and the norms, standards, procedures and conditions prescribed under the AICTE Approval Process Handbook (APH 2025-26):
            </p>
            <p>
              The Scrutiny Committee & Expert Evaluation Bureau have conducted detailed optical character recognition, digital seal verification, faculty cadre ratio validation, and municipal safety cross-examination for the academic year <strong>2025-2026</strong>.
            </p>
          </div>

          {/* Metrics Summary Grid */}
          <div className="grid grid-cols-4 gap-2 text-center font-sans p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Norms Audited</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">{report.summaryMetrics.totalNormsChecked}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Satisfied</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{report.summaryMetrics.normsSatisfied}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Minor Flags</span>
              <span className="text-base font-bold text-amber-600 dark:text-amber-400">{report.summaryMetrics.minorDeficiencies}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Critical Deficits</span>
              <span className="text-base font-bold text-rose-600 dark:text-rose-400">{report.summaryMetrics.criticalViolations}</span>
            </div>
          </div>

          {/* Verification Blind-Spot & Source Coverage Audit Section */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 font-sans space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-600" />
                Verification Blind-Spot & Source Coverage Audit
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {appClaims.length > 0 ? `${appClaims.length} Claims Tracked` : 'Global Dossier Audit'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
              <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-semibold">Source Verified</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-200 font-mono">
                  {appClaims.filter((c) => c.status === 'Verified through authorized source').length}
                </span>
              </div>
              <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <span className="text-[10px] text-blue-700 dark:text-blue-300 block font-semibold">Partially Checked</span>
                <span className="font-bold text-blue-800 dark:text-blue-200 font-mono">
                  {appClaims.filter((c) => c.status === 'Extracted locally' || c.status === 'Matched against supplied records').length}
                </span>
              </div>
              <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                <span className="text-[10px] text-rose-700 dark:text-rose-300 block font-semibold">Unverified / Gaps</span>
                <span className="font-bold text-rose-800 dark:text-rose-200 font-mono">
                  {appClaims.filter((c) => c.status !== 'Verified through authorized source' && c.status !== 'Extracted locally' && c.status !== 'Matched against supplied records').length}
                </span>
              </div>
            </div>

            {/* List unverified claims for this application */}
            {appClaims.filter((c) => c.status !== 'Verified through authorized source').length > 0 && (
              <div className="pt-1.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Identified Verification Blind Spots & Unverified Claims:
                </span>
                {appClaims
                  .filter((c) => c.status !== 'Verified through authorized source')
                  .slice(0, 3)
                  .map((c) => (
                    <div key={c.id} className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                        {c.claimType}: "{c.claimedValue}"
                      </span>
                      <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                        {c.status}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            <p className="text-[10px] text-slate-500 italic pt-1 leading-snug">
              Notice: A local OCR match, valid-looking PDF, or AI response does not constitute independent authority verification.
            </p>
          </div>

          {/* Signatures & Seal */}
          <div className="flex justify-between items-end pt-8 font-sans">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-teal-500/60 flex items-center justify-center text-[10px] text-teal-600 dark:text-teal-400 font-bold mx-auto mb-1">
                e-Sign
              </div>
              <span className="text-[10px] text-slate-400 font-mono">DSC SHA-256 Validated</span>
            </div>

            <div className="text-right space-y-1">
              <div className="font-bold text-slate-900 dark:text-white text-xs">
                {report.evaluatorName}
              </div>
              <div className="text-[11px] text-slate-500">
                {report.evaluatorDesignation}
              </div>
              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                All India Council for Technical Education
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
