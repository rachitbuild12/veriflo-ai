import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  Building,
  CheckCircle,
  FileCheck,
  FileSearch,
  FileText,
  GraduationCap,
  Layers,
  MapPin,
  PlusCircle,
  Printer,
  Scale,
  Send,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApplicationStatus } from '../../types';
import { Badge, RiskBadge, StatusBadge } from '../common/Badge';

interface Props {
  applicationId: string;
  onClose: () => void;
  onIssueDeficiency: () => void;
}

export const ApplicationDetailModal: React.FC<Props> = ({
  applicationId,
  onClose,
  onIssueDeficiency,
}) => {
  const {
    applications,
    updateApplicationStatus,
    documents,
    setSelectedDocumentId,
    setActiveTab,
    addToast,
    logAuditAction,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'programs' | 'documents' | 'deficiencies' | 'infrastructure'>('programs');

  const app = applications.find((a) => a.id === applicationId);

  if (!app) return null;

  const appDocs = documents.filter(
    (d) =>
      d.applicationId === app.id ||
      d.applicationId === app.pid ||
      (d.extractedEntities && d.extractedEntities['Permanent Institute ID (PID)'] === app.pid) ||
      (d.institutionName && d.institutionName.toLowerCase().includes(app.institutionName.slice(0, 15).toLowerCase()))
  );

  // Multi-tier stages
  const stages = [
    { name: 'Level 1: AI Scrutiny & OCR', desc: 'Automated APH rule checks & forgery detection' },
    { name: 'Level 2: Scrutiny Committee', desc: 'Regional office officer cross-verification' },
    { name: 'Level 3: EVC / Virtual Visit', desc: 'Expert inspection on ground / drone GIS' },
    { name: 'Level 4: Approval Bureau (HQ)', desc: 'Executive committee final EoA order' },
  ];

  const handleApprove = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    updateApplicationStatus(app.id, 'Approved / EoA Issued', 'All statutory norms certified compliant by Scrutiny Committee.');
    addToast('success', `Extension of Approval (EoA) granted for ${app.institutionName}.`, 'EoA Approved');
  };

  const handleEscalateToHearing = () => {
    updateApplicationStatus(app.id, 'Hearing / Appellate', 'Referred to Standing Appellate Committee due to contested deficiencies.');
    addToast('warning', `Application escalated to Standing Appellate Committee (SAC).`, 'Hearing Scheduled');
  };

  const handleScheduleEVC = () => {
    updateApplicationStatus(app.id, 'EVC Physical Inspection', 'Surprise on-site physical inspection ordered.');
    addToast('info', `Expert Visit Committee (EVC) scheduled for ${app.institutionName}.`, 'EVC Scheduled');
  };

  const handlePrintDossier = () => {
    window.print();
  };

  const calculatedFSR = app.studentStrength && app.activeFacultyCount
    ? (app.studentStrength / app.activeFacultyCount).toFixed(1)
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in-50">
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#071626] to-[#102A43] p-5 sm:p-6 text-white border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-teal-300 font-semibold bg-teal-950 border border-teal-800/80 px-2 py-0.5 rounded">
                  {app.applicationNumber}
                </span>
                <StatusBadge status={app.status} />
                <RiskBadge risk={app.overallRiskLevel} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {app.institutionName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  {app.city}, {app.state} ({app.region})
                </span>
                <span>•</span>
                <span className="font-mono">PID: {app.pid}</span>
                <span>•</span>
                <span>{app.applicationType}</span>
                <span>•</span>
                <span className="text-teal-300 font-medium">AY {app.academicYear}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workflow Progress Bar */}
          <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2">
            {stages.map((stage, idx) => {
              const isCurrent = app.currentStage.includes(`Level ${idx + 1}`);
              const isCompleted = app.status === 'Approved / EoA Issued' || (idx === 0 && app.status !== 'Under AI Scrutiny');

              return (
                <div
                  key={stage.name}
                  className={`p-2 rounded-lg border text-xs transition-colors ${
                    isCurrent
                      ? 'bg-teal-950/80 border-teal-500/80 text-teal-200'
                      : isCompleted
                      ? 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                      : 'bg-slate-900/40 border-slate-800/40 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-[11px] mb-0.5">
                    <span>Stage {idx + 1}</span>
                    {isCompleted ? (
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    ) : null}
                  </div>
                  <div className="font-medium truncate">{stage.name.split(':')[1]?.trim() || stage.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-2 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs">
          <button
            onClick={() => setActiveSubTab('programs')}
            className={`py-3 px-3 font-semibold border-b-2 transition-colors ${
              activeSubTab === 'programs'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Programs & Intake ({app.programs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('documents')}
            className={`py-3 px-3 font-semibold border-b-2 transition-colors ${
              activeSubTab === 'documents'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Dossier Documents ({appDocs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('deficiencies')}
            className={`py-3 px-3 font-semibold border-b-2 transition-colors ${
              activeSubTab === 'deficiencies'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Deficiency Notices ({app.deficiencyNotices.length})
          </button>
          <button
            onClick={() => setActiveSubTab('infrastructure')}
            className={`py-3 px-3 font-semibold border-b-2 transition-colors ${
              activeSubTab === 'infrastructure'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Infrastructure & FSR Norms
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Programs Tab */}
          {activeSubTab === 'programs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Sanctioned Divisions for Approval
                </span>
                <span className="text-slate-500">
                  Total Approved Intake:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {app.programs.reduce((sum, p) => sum + p.intake, 0)} Seats
                  </strong>
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Program / Discipline</th>
                      <th className="py-2.5 px-3">Level</th>
                      <th className="py-2.5 px-3">Sanctioned Intake</th>
                      <th className="py-2.5 px-3">NBA Status</th>
                      <th className="py-2.5 px-3">Sanctioned Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {app.programs.map((prog) => (
                      <tr key={prog.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {prog.name}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="slate" size="xs">{prog.level}</Badge>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-teal-600 dark:text-teal-400">
                          {prog.intake} seats
                        </td>
                        <td className="py-2.5 px-3">
                          {prog.nbaAccredited ? (
                            <Badge variant="success" size="xs">NBA Accredited</Badge>
                          ) : (
                            <Badge variant="slate" size="xs">Non-Accredited</Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {prog.sanctionedYear}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeSubTab === 'documents' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Uploaded Regulatory Dossiers & Verification Status
                </span>
                <span className="text-slate-500">
                  AICTE Approval Process Handbook (APH) Documents
                </span>
              </div>

              {appDocs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 border border-dashed rounded-xl">
                  No documents directly linked in this synthetic dossier.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {appDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocumentId(doc.id);
                        setActiveTab('document-verification');
                        onClose();
                      }}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 cursor-pointer bg-white dark:bg-slate-850 shadow-sm transition-all text-xs"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {doc.documentType}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            doc.verificationStatus.includes('Tampering')
                              ? 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200'
                              : doc.verificationStatus.includes('Verified')
                              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200'
                              : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200'
                          }`}
                        >
                          {doc.verificationStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{doc.fileName}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                        <span>AI Confidence: {doc.aiConfidenceScore}%</span>
                        <span className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                          Inspect & Verify →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Deficiencies Tab */}
          {activeSubTab === 'deficiencies' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Communicated Deficiency Notices & Rectifications
                </span>
                <button
                  onClick={onIssueDeficiency}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Issue New Deficiency</span>
                </button>
              </div>

              {app.deficiencyNotices.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-xl bg-slate-50 dark:bg-slate-850">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No outstanding deficiencies issued
                  </p>
                  <p className="mt-0.5">This institution fulfills all Approval Process Handbook clauses examined so far.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {app.deficiencyNotices.map((def) => (
                    <div
                      key={def.id}
                      className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                            {def.clauseCode}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            ({def.category})
                          </span>
                        </div>
                        <Badge variant={def.severity === 'Critical' ? 'danger' : 'warning'} size="xs">
                          {def.severity}
                        </Badge>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        {def.issueDescription}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-amber-200/50 dark:border-amber-900/40 text-[10px] text-slate-500">
                        <span>Issued: {def.issuedDate}</span>
                        <span className="font-semibold text-amber-700 dark:text-amber-300">
                          Compliance Deadline: {def.complianceDeadline}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Status: {def.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Infrastructure Tab */}
          {activeSubTab === 'infrastructure' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Campus Land & Area Norms
                </span>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Total Contiguous Land</span>
                  <span className="font-bold text-slate-900 dark:text-white">{app.landAreaAcres} Acres</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">APH Minimum Land Norm</span>
                  <span className="font-medium text-emerald-600">Min 2.50 Acres (Urban)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Total Built-up Area</span>
                  <span className="font-bold text-slate-900 dark:text-white">{app.builtUpAreaSqM.toLocaleString()} sq.m</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Faculty-to-Student Ratio (FSR)
                </span>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Total Enrolled / Intake</span>
                  <span className="font-bold text-slate-900 dark:text-white">{app.studentStrength} Students</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Full-Time Verified Faculty</span>
                  <span className="font-bold text-slate-900 dark:text-white">{app.activeFacultyCount} Faculty</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Calculated FSR Ratio</span>
                  <span className={`font-bold ${Number(calculatedFSR) <= 20 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    1 : {calculatedFSR} (Norm: 1:15 or 1:20)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Regulatory Action Bar Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <UserCheck className="w-4 h-4 text-teal-600" />
            <span>Assigned: <strong>{app.assignedOfficer}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintDossier}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>

            <button
              onClick={handleScheduleEVC}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Order EVC Inspection</span>
            </button>

            <button
              onClick={handleEscalateToHearing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Escalate to Hearing (SAC)</span>
            </button>

            <button
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Grant EoA Approval</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
