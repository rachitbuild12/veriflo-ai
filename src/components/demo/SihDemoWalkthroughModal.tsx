import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bot,
  Building,
  CheckCircle2,
  ChevronRight,
  Compass,
  Download,
  Eye,
  EyeOff,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FileWarning,
  Layers,
  MapPin,
  Play,
  RotateCcw,
  Share2,
  Shield,
  ShieldAlert,
  Sparkles,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateRegulatoryPDF } from '../../utils/pdfReportGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SihDemoWalkthroughModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    applications,
    documents,
    claims,
    blindSpotRecords,
    coverageSummary,
    facilities,
    infrastructureEvidence,
    missingEvidenceList,
    verificationReports,
    setActiveTab,
    setSelectedApplicationId,
    setSelectedDocumentId,
    setSelectedReportId,
    updateApplicationStatus,
    issueDeficiencyNotice,
    addToast,
    logAuditAction,
    currentRole,
  } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);

  if (!isOpen) return null;

  const targetApp =
    applications.find((a) => a.id === 'APP-2025-03') ||
    applications.find((a) => a.applicationNumber.includes('03')) ||
    applications[0];

  const markStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps((prev) => [...prev, step]);
    }
  };

  // Step 1: Submit Application
  const handleStep1 = () => {
    setSelectedApplicationId(targetApp.id);
    setActiveTab('applications');
    markStepComplete(1);
    addToast('info', `Focused on Application ${targetApp.applicationNumber}.`, 'SIH Demo Step 1');
    onClose();
  };

  // Step 2: Identify Expired Fire Certificate
  const handleStep2 = () => {
    const expiredDoc =
      documents.find((d) => d.id === 'DOC-01') ||
      documents.find((d) => d.fileName.includes('FireSafety')) ||
      documents[0];

    setSelectedDocumentId(expiredDoc.id);
    setActiveTab('document-verification');
    markStepComplete(2);
    addToast(
      'warning',
      `Identified Expired Certificate: ${expiredDoc.fileName} (Expired 30-Nov-2024).`,
      'SIH Demo Step 2'
    );
    onClose();
  };

  // Step 3: Detect Faculty Mismatch
  const handleStep3 = () => {
    const facultyDoc =
      documents.find((d) => d.id === 'DOC-03') ||
      documents.find((d) => d.fileName.includes('Faculty')) ||
      documents[0];

    setSelectedDocumentId(facultyDoc.id);
    setActiveTab('document-verification');
    markStepComplete(3);
    addToast(
      'error',
      'Faculty Mismatch Flagged: Prof. Dr. Ramesh Chandra concurrent employment detected in Lucknow.',
      'SIH Demo Step 3'
    );
    onClose();
  };

  // Step 4: Show Related Dependency Graph
  const handleStep4 = () => {
    setSelectedApplicationId(targetApp.id);
    setActiveTab('evidence-dependency-graph');
    markStepComplete(4);
    addToast(
      'info',
      'Loaded Evidence Dependency Graph for Apex Horizon showing conflicting faculty & fire nodes.',
      'SIH Demo Step 4'
    );
    onClose();
  };

  // Step 5: Simulate Intake Increase (+50%)
  const handleStep5 = () => {
    setActiveTab('compliance-time-machine');
    markStepComplete(5);
    addToast(
      'info',
      'Compliance Time Machine launched: Horizon simulation of +120 intake increase (240 -> 360).',
      'SIH Demo Step 5'
    );
    onClose();
  };

  // Step 6: Reveal Unavailable Issuer Verification Source
  const handleStep6 = () => {
    setActiveTab('blind-spot-detector');
    markStepComplete(6);
    addToast(
      'warning',
      'Verification Blind-Spot Detector: State Fire Gateway 503 & uncertified lab photo exposed.',
      'SIH Demo Step 6'
    );
    onClose();
  };

  // Step 7: Complete Reviewer Action & Export Report
  const handleStep7 = () => {
    // 1. Record Statutory Deficiency Notice
    issueDeficiencyNotice(targetApp.id, {
      clauseCode: 'APH-2025-CH2-FACULTY',
      category: 'Faculty Cadre & Ratio',
      severity: 'Critical',
      issueDescription:
        'Biometric & EPFO cross-verification confirmed Prof. Dr. Ramesh Chandra concurrently employed at another institute in Lucknow (480 km away). Substitute faculty mandatory.',
      officerRemarks:
        'Submit appointment letter, Form-16, and valid EPFO UAN transfer for a qualified full-time Professor within 15 days.',
      complianceDeadline: '2025-02-15',
      status: 'Pending Response',
    });

    // 2. Generate and download official PDF
    const targetReport =
      verificationReports.find((r) => r.applicationId === targetApp.id) || verificationReports[0];

    const pdf = generateRegulatoryPDF({
      report: targetReport,
      application: targetApp,
      documents,
      claims,
      blindSpots: blindSpotRecords,
      coverageSummary,
      facilities,
      infrastructureEvidence,
      missingEvidence: missingEvidenceList,
      scenarioDetails: {
        name: 'Proposed UG Intake Expansion (240 -> 360 Seats)',
        baselineIntake: 240,
        proposedIntake: 360,
        projectedDeficits: [
          'Faculty Shortfall: +6 additional cadre faculty required under 1:20 FSR norm',
          'Instructional Area Deficit: 2 additional 66 sq.m classrooms required',
          'Library Volumes: +1,200 additional textbook volumes required under APH 2025-26',
        ],
      },
    });

    pdf.save(`AICTE_SIH_DEMO_OFFICIAL_ORDER_${targetApp.applicationNumber.replace(/[\/\\]/g, '_')}.pdf`);

    markStepComplete(7);
    addToast(
      'success',
      'Official Regulatory Scrutiny Order PDF generated and downloaded successfully.',
      'SIH Demo Step 7 Completed'
    );
    logAuditAction(
      `Completed SIH Full Scrutiny Walkthrough & Exported PDF: ${targetApp.applicationNumber}`,
      targetApp.institutionName,
      'STATUS_CHANGE',
      'Info'
    );
    onClose();
  };

  const steps = [
    {
      num: 1,
      title: 'Submit / Register Application Dossier',
      subtitle: 'Institutional Profile & Academic Cycle',
      desc: 'Applicant institution registers an Extension of Approval (EoA) dossier with claimed intake, faculty count, and land credentials.',
      status: 'Target: Apex Horizon Institute (APP-2025-03)',
      icon: FileText,
      color: 'teal',
      actionLabel: 'Inspect Application Dossier',
      handler: handleStep1,
    },
    {
      num: 2,
      title: 'Identify Expired Certificate (Fire Safety)',
      subtitle: 'Deterministic OCR & Temporal Validation',
      desc: 'Automated verification flags an expired Fire & Life Safety NOC (Form B) valid only through 30-Nov-2024 with suspected font alteration.',
      status: 'Clause: APH Ch.4 - Mandatory Fire NOC',
      icon: AlertTriangle,
      color: 'amber',
      actionLabel: 'Audit Expired Document',
      handler: handleStep2,
    },
    {
      num: 3,
      title: 'Detect Faculty-Record Mismatch',
      subtitle: 'Cross-Database Ghost Faculty Forensics',
      desc: 'Form-16 faculty claim for Prof. Dr. Ramesh Chandra exhibits concurrent active EPFO deductions at another college in Lucknow (480 km away).',
      status: 'Clause: APH Ch.2 - Cadre & FSR Norms',
      icon: AlertOctagon,
      color: 'rose',
      actionLabel: 'Expose Faculty Mismatch',
      handler: handleStep3,
    },
    {
      num: 4,
      title: 'Trace in Evidence Dependency Graph',
      subtitle: 'Semantic Directed Lineage & Conflict Nodes',
      desc: 'Interactive node-and-edge visualization traces institutional sponsors, documents, extracted tokens, and highlights conflicting nodes.',
      status: 'Conflicting Lineage: Form-16 vs EPFO Record',
      icon: Share2,
      color: 'blue',
      actionLabel: 'Open Dependency Graph',
      handler: handleStep4,
    },
    {
      num: 5,
      title: 'Simulate Approved Intake Increase (+50%)',
      subtitle: 'Compliance Time Machine Horizon Simulation',
      desc: 'Simulates proposed expansion from 240 to 360 seats, demonstrating how faculty shortfall jumps from 2 to 8 and triggers instructional deficit.',
      status: 'Scenario: +120 Intake Horizon (APH 2025-26)',
      icon: Compass,
      color: 'purple',
      actionLabel: 'Launch Time Machine Simulation',
      handler: handleStep5,
    },
    {
      num: 6,
      title: 'Reveal Unavailable Issuer Blind Spot',
      subtitle: 'Verification Blind-Spot Detector Gap Analysis',
      desc: 'Exposes that State Fire Service portal returned HTTP 503 Service Unavailable and uncertified lab photo lacks registered architect endorsement.',
      status: 'Gaps: BS-01 (Fire 503) & BS-07 (Uncertified Lab)',
      icon: EyeOff,
      color: 'amber',
      actionLabel: 'Inspect Regulatory Blind Spots',
      handler: handleStep6,
    },
    {
      num: 7,
      title: 'Complete Reviewer Action & Export PDF Order',
      subtitle: 'GovTech Audit Trail, 15-Day Notice & Sealed PDF',
      desc: 'Officer issues statutory 15-day deficiency notice and generates cryptographically sealed multi-page PDF order with actual stored findings.',
      status: 'Outcome: Deficiencies Communicated + Downloadable PDF',
      icon: Download,
      color: 'emerald',
      actionLabel: 'Dispatch Notice & Download PDF Order',
      handler: handleStep7,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in-50 overflow-y-auto">
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-[#071626] via-[#0D2137] to-[#102A43] text-white border-b border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart India Hackathon (SIH) • Interactive Evaluator Tour</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Veriflo AI End-to-End Scrutiny Journey</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
                7-Step Scrutiny Flow
              </span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Step-by-step regulatory scrutiny walkthrough demonstrating real OCR extraction, cross-database ghost faculty detection, dependency graph lineage, intake simulation, blind-spot gap analysis, and official PDF generation.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-x-auto text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Scrutiny Stage:</span>
            <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">
              Step {currentStep} of 7
            </span>
            <span className="text-slate-400">({completedSteps.length} of 7 completed)</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {steps.map((s) => {
              const isDone = completedSteps.includes(s.num);
              const isCurrent = currentStep === s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => setCurrentStep(s.num)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                    isCurrent
                      ? 'bg-teal-600 text-white ring-2 ring-teal-400 scale-110'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                  title={s.title}
                >
                  {isDone ? '✓' : s.num}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Active Step Detail */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {(() => {
            const activeStepObj = steps[currentStep - 1];
            const Icon = activeStepObj.icon;
            const isDone = completedSteps.includes(activeStepObj.num);

            return (
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="p-3.5 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-950/40 shrink-0">
                    <Icon className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                        Step 0{activeStepObj.num} • {activeStepObj.subtitle}
                      </span>
                      {isDone && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Step Executed</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {activeStepObj.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeStepObj.desc}
                    </p>
                    <div className="pt-2 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {activeStepObj.status}
                    </div>
                  </div>
                </div>

                {/* Primary Action Button for this step */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-2xl">
                  <div className="text-xs text-teal-900 dark:text-teal-200">
                    <span className="font-bold">Next Recommended Action:</span>
                    <span className="ml-1 text-slate-700 dark:text-slate-300">
                      Click to execute Step {currentStep} and view the live, shared persisted evidence.
                    </span>
                  </div>

                  <button
                    onClick={activeStepObj.handler}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-950/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shrink-0"
                  >
                    <span>{activeStepObj.actionLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* All 7 Steps Overview Cards */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Complete SIH Scrutiny Pipeline Overview
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {steps.map((s) => {
                const isCurrent = currentStep === s.num;
                const isDone = completedSteps.includes(s.num);
                const Icon = s.icon;

                return (
                  <div
                    key={s.num}
                    onClick={() => setCurrentStep(s.num)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                      isCurrent
                        ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 ring-1 ring-teal-500'
                        : isDone
                        ? 'border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900/60'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isDone ? '✓' : s.num}
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900 dark:text-white truncate">
                          {s.title}
                        </h5>
                        <span className="text-[10px] text-slate-400">Step {s.num}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {s.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <span>Active Officer: {currentRole.split('(')[0].trim()}</span>
            <span>•</span>
            <span className="text-amber-500">[Synthetic Demo Safe Mode]</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentStep(1);
                setCompletedSteps([1]);
                addToast('info', 'Demo stepper reset to Step 1.', 'Tour Reset');
              }}
              className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Tour</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold"
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
