import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  SCRUTINY_CYCLE_STATS,
  SYNTHETIC_APPLICATIONS,
  SYNTHETIC_AUDIT_LOGS,
  SYNTHETIC_BLIND_SPOTS,
  SYNTHETIC_COMPLIANCE_RULES,
  SYNTHETIC_DEPENDENCY_EDGES,
  SYNTHETIC_DEPENDENCY_NODES,
  SYNTHETIC_DOCUMENTS,
  SYNTHETIC_INSTITUTIONS,
  SYNTHETIC_NOTIFICATIONS,
  SYNTHETIC_REPORTS,
  SYNTHETIC_REVIEW_QUEUE,
  SYNTHETIC_SOURCE_REGISTRIES,
  SYNTHETIC_TIME_MACHINE_SCENARIOS,
} from '../data/mockData';
import {
  Application,
  ApplicationStatus,
  AuditLogItem,
  BlindSpotItem,
  ComplianceRule,
  DeficiencyNotice,
  DependencyEdge,
  DependencyNode,
  DocumentVerificationItem,
  InstitutionRecord,
  NavigationTab,
  NotificationItem,
  OfficerRole,
  ReviewQueueItem,
  SourceRegistryStatus,
  TimeMachineScenario,
  VerificationReport,
} from '../types';
import {
  DocumentClaim,
  BlindSpotRecord,
  VerificationCoverageSummary,
  ManualReviewInput,
  getInitialClaimsAndBlindSpots,
  calculateVerificationCoverage,
  executeManualClaimVerification,
  transitionClaimStatus,
  AuthorizedVerificationEvidence,
} from '../components/blindspot/blindSpotModel';
import {
  ClaimedFacility,
  InfrastructureEvidence,
  MissingEvidenceItem,
  ImageAnnotation,
  InfrastructureEvidenceType,
  FacilityType,
  getInitialInfrastructureDataset,
} from '../components/infrastructure/infrastructureModel';
import {
  checkBackendHealth,
  fetchVerificationRecords,
  uploadAndVerifyDocument,
  BackendVerificationResult,
  UploadOptions,
} from '../services/api';

export type { NavigationTab } from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
}

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentRole: OfficerRole;
  setCurrentRole: (role: OfficerRole) => void;
  
  // Data entities
  applications: Application[];
  documents: DocumentVerificationItem[];
  complianceRules: ComplianceRule[];
  institutions: InstitutionRecord[];
  reviewQueue: ReviewQueueItem[];
  auditLogs: AuditLogItem[];
  verificationReports: VerificationReport[];
  notifications: NotificationItem[];
  stats: typeof SCRUTINY_CYCLE_STATS;

  // New GovTech Intelligence Datasets
  timeMachineScenarios: TimeMachineScenario[];
  activeScenarioId: string;
  setActiveScenarioId: (id: string) => void;
  dependencyNodes: DependencyNode[];
  dependencyEdges: DependencyEdge[];
  blindSpots: BlindSpotItem[];
  sourceRegistries: SourceRegistryStatus[];

  // Verification Blind-Spot Detector & Claims
  claims: DocumentClaim[];
  blindSpotRecords: BlindSpotRecord[];
  coverageSummary: VerificationCoverageSummary;
  manualVerificationModalOpen: boolean;
  setManualVerificationModalOpen: (open: boolean) => void;
  activeClaimForManualVerification: DocumentClaim | null;
  setActiveClaimForManualVerification: (claim: DocumentClaim | null) => void;
  performManualClaimVerification: (claimId: string, input: ManualReviewInput) => { success: boolean; error?: string };
  resolveBlindSpotRecord: (id: string, notes: string, resolvedBy: string) => void;
  triggerAuthorizedDemoProbe: (claimId: string) => void;

  // Infrastructure Evidence Review
  facilities: ClaimedFacility[];
  infrastructureEvidence: InfrastructureEvidence[];
  missingEvidenceList: MissingEvidenceItem[];
  addEvidenceAnnotation: (evidenceId: string, annotation: Omit<ImageAnnotation, 'id' | 'timestamp'>) => void;
  confirmAiAnnotation: (evidenceId: string, annotationId: string) => void;
  deleteAnnotation: (evidenceId: string, annotationId: string) => void;
  recordMissingEvidence: (item: Omit<MissingEvidenceItem, 'id' | 'timestamp'>) => void;
  updateEvidenceReviewerVerdict: (
    evidenceId: string,
    verdict: InfrastructureEvidence['reviewerVerdict'],
    notes: string,
    reviewerName: string
  ) => void;
  uploadInfrastructureEvidence: (
    file: File,
    meta: {
      facilityId: string;
      title: string;
      evidenceType: InfrastructureEvidenceType;
      facilityType: FacilityType;
      applicationId?: string;
      institutionName?: string;
    }
  ) => Promise<InfrastructureEvidence>;

  // Selected for modals/deep-links
  selectedApplicationId: string | null;
  setSelectedApplicationId: (id: string | null) => void;
  selectedDocumentId: string | null;
  setSelectedDocumentId: (id: string | null) => void;
  selectedInstitutionId: string | null;
  setSelectedInstitutionId: (id: string | null) => void;
  selectedReportId: string | null;
  setSelectedReportId: (id: string | null) => void;

  // Global modals
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  newAppModalOpen: boolean;
  setNewAppModalOpen: (open: boolean) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  sihDemoModalOpen: boolean;
  setSihDemoModalOpen: (open: boolean) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string, title?: string) => void;
  removeToast: (id: string) => void;

  // Backend Integration State
  backendOnline: boolean;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  uploadDocument: (file: File, options?: UploadOptions, onProgress?: (p: number) => void) => Promise<DocumentVerificationItem>;
  refreshBackendRecords: () => Promise<void>;

  // Actions
  addApplication: (app: Application) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus, officerRemarks?: string) => void;
  issueDeficiencyNotice: (applicationId: string, notice: Omit<DeficiencyNotice, 'id' | 'issuedDate'>) => void;
  verifyDocument: (docId: string, status: DocumentVerificationItem['verificationStatus'], remarks: string) => void;
  overrideTamperAlert: (docId: string, reason: string) => void;
  toggleRuleActive: (ruleId: string) => void;
  logAuditAction: (action: string, targetEntity: string, category: AuditLogItem['category'], severity: AuditLogItem['severity']) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addVerificationReport: (report: VerificationReport) => void;
  resolveBlindSpot: (id: string, newStatus: BlindSpotItem['status']) => void;
  pingSourceRegistry: (id: string) => void;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to convert backend result into DocumentVerificationItem
function backendToDocumentItem(record: BackendVerificationResult): DocumentVerificationItem {
  const ext = record.extracted_data || {};
  const statusMapping: Record<string, DocumentVerificationItem['verificationStatus']> = {
    'Verified (Compliant)': 'Verified (Compliant)',
    'Deficiency Flagged': 'Deficiency Flagged',
    'Tampering / Anomaly Suspected': 'Tampering / Forgery Suspected',
    'Officer Manual Review Needed': 'Officer Manual Review Needed',
  };

  const entities: Record<string, string | number> = {};
  if (ext.institution_id) entities['Permanent Institute ID (PID)'] = ext.institution_id;
  if (ext.certificate_number) entities['Certificate Reference No'] = ext.certificate_number;
  if (ext.dates?.issue_date) entities['Issue Date'] = ext.dates.issue_date;
  if (ext.dates?.expiry_date) entities['Expiry / Validity Date'] = ext.dates.expiry_date;
  if (ext.faculty_members?.length) entities['Faculty Count (Extracted)'] = ext.faculty_members.length;
  if (ext.approved_intake_total) entities['Sanctioned Intake Total'] = ext.approved_intake_total;
  if (ext.fee_amounts?.regulatory_fee) entities['Regulatory Fee Paid'] = `₹${ext.fee_amounts.regulatory_fee.toLocaleString('en-IN')}`;

  return {
    id: record.id,
    applicationId: ext.institution_id || 'DOC-VERIFIED',
    institutionName: record.institution_name || ext.institution_name || 'Verified Institution Dossier',
    documentType: (record.document_type as any) || 'Statutory Compliance Record',
    fileName: record.file_name,
    uploadedAt: record.upload_timestamp,
    fileSize: `${(record.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`,
    aiConfidenceScore: record.ai_confidence_score,
    verificationStatus: statusMapping[record.overall_status] || 'Officer Manual Review Needed',
    extractedEntities: entities,
    deficiencyFindings: (record.findings || [])
      .filter((f) => !f.passed)
      .map((f) => ({
        clause: f.clause,
        message: `${f.observed_value} (Recommended: ${f.recommended_action})`,
        severity: f.severity === 'Info' ? 'Minor' : (f.severity as any),
      })),
    tamperSignals: (record.tamper_signals || []).map((s) => ({
      type: s.type as any,
      area: s.area,
      confidence: s.confidence,
      detail: s.detail,
    })),
    scrutinyRemarks: record.forensic_summary || 'Processed through FastAPI document verification pipeline.',
    verifiedBy: record.overall_status === 'Verified (Compliant)' ? 'AI Fast-Track Verification' : null,
    verifiedAt: record.overall_status === 'Verified (Compliant)' ? record.upload_timestamp : null,
    isSynthetic: false, // Explicit real upload
    sha256Hash: record.file_hash_sha256,
    isDuplicate: record.is_duplicate,
    duplicateOf: record.duplicate_of,
    ocrEngineUsed: record.ocr_engine_used,
    structuredFindings: record.findings,
    rawExtractedData: ext,
  };
}

const STORAGE_PREFIX = 'veriflo_ai_state_v2_';

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw) return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
  }
  return defaultValue;
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    }
  } catch (err) {
    // Gracefully handle storage errors
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabRaw] = useState<NavigationTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentRole, setCurrentRole] = useState<OfficerRole>('Regional Scrutiny Officer (WRO)');

  const [applications, setApplications] = useState<Application[]>(() =>
    getStoredItem('applications', SYNTHETIC_APPLICATIONS)
  );
  
  // Tag initial demo documents with isSynthetic: true
  const initialLabeledDemoDocs: DocumentVerificationItem[] = SYNTHETIC_DOCUMENTS.map((doc) => ({
    ...doc,
    isSynthetic: true,
  }));
  const [documents, setDocuments] = useState<DocumentVerificationItem[]>(() =>
    getStoredItem('documents', initialLabeledDemoDocs)
  );
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>(SYNTHETIC_COMPLIANCE_RULES);
  const [institutions, setInstitutions] = useState<InstitutionRecord[]>(SYNTHETIC_INSTITUTIONS);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>(() =>
    getStoredItem('reviewQueue', SYNTHETIC_REVIEW_QUEUE)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() =>
    getStoredItem('auditLogs', SYNTHETIC_AUDIT_LOGS)
  );
  const [verificationReports, setVerificationReports] = useState<VerificationReport[]>(() =>
    getStoredItem('reports', SYNTHETIC_REPORTS)
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(SYNTHETIC_NOTIFICATIONS);
  const [stats] = useState(SCRUTINY_CYCLE_STATS);

  // New modules state
  const [timeMachineScenarios] = useState<TimeMachineScenario[]>(SYNTHETIC_TIME_MACHINE_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(SYNTHETIC_TIME_MACHINE_SCENARIOS[0]?.id || 'SCENARIO-30D');
  const [dependencyNodes] = useState<DependencyNode[]>(SYNTHETIC_DEPENDENCY_NODES);
  const [dependencyEdges] = useState<DependencyEdge[]>(SYNTHETIC_DEPENDENCY_EDGES);
  const [blindSpots, setBlindSpots] = useState<BlindSpotItem[]>(SYNTHETIC_BLIND_SPOTS);
  const [sourceRegistries, setSourceRegistries] = useState<SourceRegistryStatus[]>(SYNTHETIC_SOURCE_REGISTRIES);

  // Verification Blind-Spot Detector & Claims State
  const initialClaimsAndSpots = useMemo(() => getInitialClaimsAndBlindSpots(), []);
  const [claims, setClaims] = useState<DocumentClaim[]>(() =>
    getStoredItem('claims', initialClaimsAndSpots.claims)
  );
  const [blindSpotRecords, setBlindSpotRecords] = useState<BlindSpotRecord[]>(() =>
    getStoredItem('blindSpots', initialClaimsAndSpots.blindSpots)
  );
  const [manualVerificationModalOpen, setManualVerificationModalOpen] = useState(false);
  const [activeClaimForManualVerification, setActiveClaimForManualVerification] = useState<DocumentClaim | null>(null);

  const coverageSummary = useMemo(() => {
    return calculateVerificationCoverage(claims, blindSpotRecords);
  }, [claims, blindSpotRecords]);

  // Infrastructure Evidence Review State
  const initialInfra = useMemo(() => getInitialInfrastructureDataset(), []);
  const [facilities, setFacilities] = useState<ClaimedFacility[]>(() =>
    getStoredItem('facilities', initialInfra.facilities)
  );
  const [infrastructureEvidence, setInfrastructureEvidence] = useState<InfrastructureEvidence[]>(() =>
    getStoredItem('infrastructureEvidence', initialInfra.evidenceList)
  );
  const [missingEvidenceList, setMissingEvidenceList] = useState<MissingEvidenceItem[]>(() =>
    getStoredItem('missingEvidence', initialInfra.missingEvidenceList)
  );

  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [newAppModalOpen, setNewAppModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [sihDemoModalOpen, setSihDemoModalOpen] = useState(false);

  // Auto-persist synchronized datasets to localStorage
  useEffect(() => { setStoredItem('applications', applications); }, [applications]);
  useEffect(() => { setStoredItem('documents', documents); }, [documents]);
  useEffect(() => { setStoredItem('reviewQueue', reviewQueue); }, [reviewQueue]);
  useEffect(() => { setStoredItem('auditLogs', auditLogs); }, [auditLogs]);
  useEffect(() => { setStoredItem('reports', verificationReports); }, [verificationReports]);
  useEffect(() => { setStoredItem('claims', claims); }, [claims]);
  useEffect(() => { setStoredItem('blindSpots', blindSpotRecords); }, [blindSpotRecords]);
  useEffect(() => { setStoredItem('facilities', facilities); }, [facilities]);
  useEffect(() => { setStoredItem('infrastructureEvidence', infrastructureEvidence); }, [infrastructureEvidence]);
  useEffect(() => { setStoredItem('missingEvidence', missingEvidenceList); }, [missingEvidenceList]);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Backend Integration State
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Check health and sync records on mount
  const refreshBackendRecords = useCallback(async () => {
    const health = await checkBackendHealth();
    setBackendOnline(health.online);
    if (health.online) {
      const records = await fetchVerificationRecords();
      if (records && records.length > 0) {
        const realDocs = records.map(backendToDocumentItem);
        setDocuments((prev) => {
          // Keep synthetic docs, prepend real backend docs (prevent duplicate IDs)
          const realIds = new Set(realDocs.map((d) => d.id));
          const filteredPrev = prev.filter((d) => !realIds.has(d.id));
          return [...realDocs, ...filteredPrev];
        });
      }
    }
  }, []);

  useEffect(() => {
    refreshBackendRecords();
  }, [refreshBackendRecords]);

  // Wrap setActiveTab to handle alias
  const setActiveTab = (tab: NavigationTab) => {
    if ((tab as any) === 'audit-logs') {
      setActiveTabRaw('audit-trail');
    } else {
      setActiveTabRaw(tab);
    }
  };

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Global keyboard shortcuts (Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const addToast = (type: ToastMessage['type'], message: string, title?: string) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logAuditAction = (
    action: string,
    targetEntity: string,
    category: AuditLogItem['category'],
    severity: AuditLogItem['severity']
  ) => {
    const newLog: AuditLogItem = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: currentRole.split('(')[0].trim(),
      role: currentRole,
      ipAddress: '115.112.45.68 (Secure GovNet)',
      action,
      targetEntity,
      category,
      severity,
      hash: Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const uploadDocument = async (
    file: File,
    options: UploadOptions = {},
    onProgress?: (p: number) => void
  ): Promise<DocumentVerificationItem> => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const result = await uploadAndVerifyDocument(
        file,
        options,
        (progress) => {
          setUploadProgress(progress);
          if (onProgress) onProgress(progress);
        }
      );

      const docItem = backendToDocumentItem(result);
      setDocuments((prev) => [docItem, ...prev.filter((d) => d.id !== docItem.id)]);
      setSelectedDocumentId(docItem.id);

      logAuditAction(
        `Document Uploaded & Verified via AI Pipeline: ${docItem.fileName} (${docItem.verificationStatus})`,
        docItem.id,
        'AI_SCAN',
        docItem.verificationStatus === 'Tampering / Forgery Suspected' ? 'Critical' : 'Info'
      );

      addToast(
        docItem.verificationStatus === 'Verified (Compliant)'
          ? 'success'
          : docItem.verificationStatus === 'Tampering / Forgery Suspected'
          ? 'warning'
          : 'info',
        `Verification complete for ${docItem.fileName}. Status: ${docItem.verificationStatus}`,
        'Document Processed'
      );

      setIsUploading(false);
      setUploadProgress(100);
      return docItem;
    } catch (err: any) {
      const msg = err.message || 'Upload failed';
      setUploadError(msg);
      setIsUploading(false);
      addToast('error', msg, 'Upload Failed');
      throw err;
    }
  };

  const addApplication = (app: Application) => {
    setApplications((prev) => [app, ...prev]);
    const newQueueItem: ReviewQueueItem = {
      id: `Q-${Date.now().toString().slice(-4)}`,
      applicationId: app.id,
      institutionName: app.institutionName,
      pid: app.pid,
      region: app.region,
      priority: app.overallRiskLevel === 'Severe' || app.overallRiskLevel === 'High' ? 'Urgent' : 'Normal',
      daysInQueue: 1,
      stage: app.currentStage,
      flagReason: app.deficienciesCount > 0 ? `${app.deficienciesCount} Deficiencies Flagged` : 'Initial Scrutiny Pending',
      aiRiskScore: app.overallRiskLevel === 'Severe' ? 88 : app.overallRiskLevel === 'High' ? 72 : 25,
      recommendedAction: 'Execute Level 1 AI Scrutiny and Document Verification',
      assignedTo: currentRole,
    };
    setReviewQueue((prev) => [newQueueItem, ...prev]);
    logAuditAction('New Regulatory Application Dossier Submitted', app.applicationNumber, 'STATUS_CHANGE', 'Info');
    addToast('success', `Application ${app.applicationNumber} registered successfully for ${app.institutionName}.`, 'Application Created');
  };

  const updateApplicationStatus = (id: string, status: ApplicationStatus, officerRemarks?: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          return {
            ...app,
            status,
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        return app;
      })
    );
    const target = applications.find((a) => a.id === id);
    const appNum = target ? target.applicationNumber : id;
    logAuditAction(
      `Application Status Updated to: ${status}${officerRemarks ? ` | Remarks: ${officerRemarks}` : ''}`,
      appNum,
      'STATUS_CHANGE',
      status === 'Rejected' ? 'Critical' : 'Info'
    );
    addToast('info', `Status for ${appNum} updated to "${status}".`, 'Application Status Updated');
  };

  const issueDeficiencyNotice = (
    applicationId: string,
    noticeData: Omit<DeficiencyNotice, 'id' | 'issuedDate'>
  ) => {
    const noticeId = `DEF-${Math.floor(1000 + Math.random() * 9000)}`;
    const newNotice: DeficiencyNotice = {
      ...noticeData,
      id: noticeId,
      issuedDate: new Date().toISOString().split('T')[0],
    };

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === applicationId) {
          return {
            ...app,
            deficienciesCount: app.deficienciesCount + 1,
            deficiencyNotices: [newNotice, ...app.deficiencyNotices],
            status: 'Deficiencies Communicated',
            overallRiskLevel: noticeData.severity === 'Critical' ? 'Severe' : 'High',
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        return app;
      })
    );

    const app = applications.find((a) => a.id === applicationId);
    logAuditAction(
      `Statutory Deficiency Notice Issued: Clause ${noticeData.clauseCode} (${noticeData.severity})`,
      app ? app.applicationNumber : applicationId,
      'DEFICIENCY_NOTICE',
      noticeData.severity === 'Critical' ? 'Critical' : 'Warning'
    );
    addToast('warning', `Deficiency Notice ${noticeId} dispatched with deadline ${noticeData.complianceDeadline}.`, 'Notice Dispatched');
  };

  const verifyDocument = (
    docId: string,
    status: DocumentVerificationItem['verificationStatus'],
    remarks: string
  ) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            verificationStatus: status,
            scrutinyRemarks: remarks,
            verifiedBy: currentRole,
            verifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          };
        }
        return doc;
      })
    );
    logAuditAction(`Document Verification Recorded: ${status}`, `Doc ID: ${docId}`, 'STATUS_CHANGE', 'Info');
    addToast('success', `Document ${docId} verified as "${status}".`, 'Verification Recorded');
  };

  const overrideTamperAlert = (docId: string, reason: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            verificationStatus: 'Verified (Compliant)',
            officerOverride: {
              overriddenBy: currentRole,
              reason,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            },
          };
        }
        return doc;
      })
    );
    logAuditAction(`AI Tamper Alert Overridden: Reason: ${reason}`, `Doc ID: ${docId}`, 'OFFICER_OVERRIDE', 'Warning');
    addToast('warning', `AI Tamper alert for ${docId} overridden by ${currentRole}.`, 'Officer Override Logged');
  };

  const toggleRuleActive = (ruleId: string) => {
    setComplianceRules((prev) =>
      prev.map((rule) => {
        if (rule.id === ruleId) {
          const updated = !rule.isActive;
          logAuditAction(`Rule Enforcement ${updated ? 'Activated' : 'Deactivated'}: ${rule.clauseCode}`, rule.title, 'RULE_UPDATE', 'Info');
          return { ...rule, isActive: updated };
        }
        return rule;
      })
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('info', 'All notifications marked as read.');
  };

  const addVerificationReport = (report: VerificationReport) => {
    setVerificationReports((prev) => [report, ...prev]);
    logAuditAction(`New Regulatory Scrutiny Report Generated: ${report.reportNumber}`, report.institutionName, 'EOA_GENERATION', 'Info');
    addToast('success', `Report ${report.reportNumber} generated.`, 'Report Generated');
  };

  const resolveBlindSpot = (id: string, newStatus: BlindSpotItem['status']) => {
    setBlindSpots((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    logAuditAction(`Regulatory Blind-Spot Status Updated: ${newStatus}`, id, 'STATUS_CHANGE', 'Info');
    addToast('success', `Blind-spot vulnerability [${id}] marked as "${newStatus}".`, 'Audit Probe Dispatched');
  };

  const pingSourceRegistry = (id: string) => {
    setSourceRegistries((prev) =>
      prev.map((reg) => {
        if (reg.id === id) {
          return {
            ...reg,
            lastPing: 'Just now',
            status: 'Synchronized',
            latencyMs: Math.floor(80 + Math.random() * 120),
          };
        }
        return reg;
      })
    );
    addToast('info', `Source registry verification gateway handshake synchronized.`, 'Registry Handshake OK');
  };

  const performManualClaimVerification = useCallback(
    (claimId: string, input: ManualReviewInput) => {
      const targetClaim = claims.find((c) => c.id === claimId);
      if (!targetClaim) {
        return { success: false, error: 'Claim not found.' };
      }

      const result = executeManualClaimVerification(targetClaim, input);
      if (!result.success) {
        addToast('error', result.error || 'Manual verification failed regulatory validation.', 'Verification Error');
        return { success: false, error: result.error };
      }

      // Update claim
      setClaims((prev) => prev.map((c) => (c.id === claimId ? result.claim : c)));

      // If claim had an associated blind spot, resolve it
      if (targetClaim.blindSpotId) {
        setBlindSpotRecords((prev) =>
          prev.map((b) =>
            b.id === targetClaim.blindSpotId
              ? {
                  ...b,
                  resolved: true,
                  resolutionRecord: {
                    resolvedBy: `${input.reviewerName} (${input.reviewerRole})`,
                    resolvedAt: new Date().toISOString(),
                    resolutionNotes: input.notes,
                    resultingStatus: input.outcomeStatus,
                  },
                }
              : b
          )
        );
      }

      // Add audit log
      logAuditAction(
        `Manual Claim Verification Executed: ${targetClaim.claimType} -> ${input.outcomeStatus}`,
        `${targetClaim.institutionName} (${targetClaim.sourceDocumentName})`,
        'OFFICER_OVERRIDE',
        input.outcomeStatus === 'Verified through authorized source' ? 'Info' : 'Warning'
      );

      addToast(
        'success',
        `Claim manually verified as "${input.outcomeStatus}" with reference: ${input.evidenceReference}`,
        'Manual Verification Recorded'
      );

      return { success: true };
    },
    [claims, addToast, logAuditAction]
  );

  const resolveBlindSpotRecord = useCallback(
    (id: string, notes: string, resolvedBy: string) => {
      setBlindSpotRecords((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                resolved: true,
                resolutionRecord: {
                  resolvedBy,
                  resolvedAt: new Date().toISOString(),
                  resolutionNotes: notes,
                  resultingStatus: 'Verified through authorized source',
                },
              }
            : b
        )
      );

      // Also update linked claim if any
      setClaims((prev) =>
        prev.map((c) => {
          if (c.blindSpotId === id) {
            return {
              ...c,
              status: 'Verified through authorized source',
              statusReason: `Remediated via audit resolution: ${notes}`,
              authorizedEvidence: {
                sourceIdentity: `Manual Resolution (${resolvedBy})`,
                verificationTime: new Date().toISOString(),
                evidenceReference: `AUDIT-RES-${id}`,
                isManualReview: true,
                reviewerIdentity: resolvedBy,
                reviewerNotes: notes,
              },
            };
          }
          return c;
        })
      );

      addToast('success', 'Regulatory blind spot marked as resolved with audit justification.', 'Blind Spot Resolved');
      logAuditAction(`Blind Spot Remediated: ${id}`, notes, 'STATUS_CHANGE', 'Info');
    },
    [addToast, logAuditAction]
  );

  const triggerAuthorizedDemoProbe = useCallback(
    (claimId: string) => {
      const targetClaim = claims.find((c) => c.id === claimId);
      if (!targetClaim) return;

      // Explicit synthetic demo simulation!
      const demoEvidence: AuthorizedVerificationEvidence = {
        sourceIdentity: `State Directorate Gateway Probe [SYNTHETIC DEMO SIMULATION]`,
        verificationTime: new Date().toISOString(),
        evidenceReference: `SIM-PROBE-${Date.now().toString().slice(-6)}-DEMO`,
        isSyntheticDemo: true,
      };

      const res = transitionClaimStatus(targetClaim, 'Verified through authorized source', demoEvidence, {
        statusReason: 'Simulated dynamic handshake succeeded with external directory [DEMO MODE ONLY].',
      });

      if (res.success) {
        setClaims((prev) => prev.map((c) => (c.id === claimId ? res.claim : c)));
        if (targetClaim.blindSpotId) {
          setBlindSpotRecords((prev) =>
            prev.map((b) => (b.id === targetClaim.blindSpotId ? { ...b, resolved: true } : b))
          );
        }
        addToast(
          'info',
          `Simulated authorized handshake probe succeeded for ${targetClaim.claimType} (Demo Mode).`,
          'Demo Probe Complete'
        );
        logAuditAction(`Demo Authorized Handshake Probe: ${targetClaim.claimType}`, targetClaim.institutionName, 'AI_SCAN', 'Info');
      }
    },
    [claims, addToast, logAuditAction]
  );

  const addEvidenceAnnotation = useCallback(
    (evidenceId: string, annotation: Omit<ImageAnnotation, 'id' | 'timestamp'>) => {
      const newAnnotation: ImageAnnotation = {
        ...annotation,
        id: `ANN-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toISOString(),
      };

      setInfrastructureEvidence((prev) =>
        prev.map((e) => {
          if (e.id === evidenceId) {
            return {
              ...e,
              annotations: [...e.annotations, newAnnotation],
              reviewHistory: [
                ...e.reviewHistory,
                {
                  reviewedBy: annotation.annotatedBy,
                  action: `Annotation Added: ${annotation.label}`,
                  timestamp: new Date().toISOString(),
                  notes: annotation.notes,
                },
              ],
            };
          }
          return e;
        })
      );

      addToast('info', `Annotation "${annotation.label}" pinned on evidence.`, 'Annotation Added');
      logAuditAction(`Annotated Infrastructure Evidence ${evidenceId}`, annotation.label, 'AI_SCAN', 'Info');
    },
    [addToast, logAuditAction]
  );

  const confirmAiAnnotation = useCallback(
    (evidenceId: string, annotationId: string) => {
      setInfrastructureEvidence((prev) =>
        prev.map((e) => {
          if (e.id === evidenceId) {
            return {
              ...e,
              annotations: e.annotations.map((a) =>
                a.id === annotationId
                  ? { ...a, isReviewerConfirmed: true, isAiSuggestion: false }
                  : a
              ),
            };
          }
          return e;
        })
      );
      addToast('success', 'AI suggestion confirmed as official reviewer observation.', 'Confirmed by Officer');
    },
    [addToast]
  );

  const deleteAnnotation = useCallback(
    (evidenceId: string, annotationId: string) => {
      setInfrastructureEvidence((prev) =>
        prev.map((e) => {
          if (e.id === evidenceId) {
            return {
              ...e,
              annotations: e.annotations.filter((a) => a.id !== annotationId),
            };
          }
          return e;
        })
      );
      addToast('info', 'Annotation removed from evidence.', 'Annotation Deleted');
    },
    [addToast]
  );

  const recordMissingEvidence = useCallback(
    (item: Omit<MissingEvidenceItem, 'id' | 'timestamp'>) => {
      const newMissing: MissingEvidenceItem = {
        ...item,
        id: `MISS-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toISOString(),
        resolved: false,
      };

      setMissingEvidenceList((prev) => [...prev, newMissing]);

      setFacilities((prev) =>
        prev.map((f) => {
          if (f.id === item.facilityClaimId) {
            return {
              ...f,
              status: item.severity === 'Critical' ? 'Deficit Flagged' : f.status,
              missingEvidenceIds: [...f.missingEvidenceIds, newMissing.id],
            };
          }
          return f;
        })
      );

      addToast(
        'warning',
        `Missing evidence recorded: "${item.missingEvidenceType}" for ${item.facilityName}`,
        'Deficit Noted'
      );
      logAuditAction(
        `Recorded Missing Evidence: ${item.missingEvidenceType}`,
        item.facilityName,
        'DEFICIENCY_NOTICE',
        item.severity === 'Critical' ? 'Critical' : 'Warning'
      );
    },
    [addToast, logAuditAction]
  );

  const updateEvidenceReviewerVerdict = useCallback(
    (
      evidenceId: string,
      verdict: InfrastructureEvidence['reviewerVerdict'],
      notes: string,
      reviewerName: string
    ) => {
      let targetFacilityId = '';

      setInfrastructureEvidence((prev) =>
        prev.map((e) => {
          if (e.id === evidenceId) {
            targetFacilityId = e.linkedFacilityId;
            return {
              ...e,
              reviewerVerdict: verdict,
              reviewerNotes: notes,
              reviewHistory: [
                ...e.reviewHistory,
                {
                  reviewedBy: reviewerName,
                  action: `Reviewer Determination: ${verdict}`,
                  timestamp: new Date().toISOString(),
                  notes,
                },
              ],
            };
          }
          return e;
        })
      );

      if (targetFacilityId) {
        setFacilities((prev) =>
          prev.map((f) => {
            if (f.id === targetFacilityId) {
              return {
                ...f,
                status:
                  verdict === 'Deficiency Flagged'
                    ? 'Deficit Flagged'
                    : verdict === 'Satisfactory Supporting Evidence'
                    ? 'Compliant'
                    : verdict === 'Inconclusive / Physical EVC Needed'
                    ? 'Inconclusive'
                    : f.status,
                reviewerVerdictNotes: notes,
              };
            }
            return f;
          })
        );
      }

      addToast('success', `Evidence determination updated to: "${verdict}".`, 'Verdict Recorded');
      logAuditAction(
        `Infrastructure Verdict: ${verdict}`,
        evidenceId,
        'OFFICER_OVERRIDE',
        verdict === 'Deficiency Flagged' ? 'Warning' : 'Info'
      );
    },
    [addToast, logAuditAction]
  );

  const uploadInfrastructureEvidence = useCallback(
    async (
      file: File,
      meta: {
        facilityId: string;
        title: string;
        evidenceType: InfrastructureEvidenceType;
        facilityType: FacilityType;
        applicationId?: string;
        institutionName?: string;
      }
    ): Promise<InfrastructureEvidence> => {
      const sha256 =
        'simulated_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const isDuplicate = infrastructureEvidence.some(
        (e) => e.sha256Hash === sha256 || e.fileName === file.name
      );

      const newEvidence: InfrastructureEvidence = {
        id: `INFRA-${Date.now().toString().slice(-4)}`,
        applicationId: meta.applicationId || 'APP-2025-01',
        institutionName: meta.institutionName || 'Veermata Jijabai Technological Institute (VJTI) [Synthetic]',
        pid: '1-429810931',
        title: meta.title,
        evidenceType: meta.evidenceType,
        facilityType: meta.facilityType,
        linkedFacilityId: meta.facilityId,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadedAt: new Date().toISOString(),
        extractedText: `Extracted text from ${file.name} • Certified layout inspection`,
        aiClassification:
          meta.evidenceType === 'Photograph'
            ? 'Infrastructure Photographic Filing'
            : meta.evidenceType === 'Floor Plan / Blueprint'
            ? 'Architectural Blueprint / CAD Dimension Plan'
            : 'Statutory Building Certificate',
        aiConfidence: 91.5,
        qualityIssues: file.size < 100 * 1024 ? ['Low Resolution (<150 DPI)'] : [],
        metadataAnomalies: isDuplicate ? ['Duplicate Photo Collision'] : [],
        exifMetadata: {
          software: 'Official Digital Camera Firmware',
          originalDate: new Date().toISOString(),
          hasGeoTag: meta.evidenceType === 'Photograph',
        },
        sha256Hash: sha256,
        isDuplicate,
        annotations: [],
        reviewHistory: [
          {
            reviewedBy: 'AI Optical Ingestion Pipeline',
            action: 'Document Uploaded & Categorized',
            timestamp: new Date().toISOString(),
            notes: `Classified as ${meta.evidenceType} under ${meta.facilityType}.`,
          },
        ],
        reviewerVerdict: 'Unreviewed',
      };

      setInfrastructureEvidence((prev) => [newEvidence, ...prev]);

      setFacilities((prev) =>
        prev.map((f) => {
          if (f.id === meta.facilityId) {
            return {
              ...f,
              evidenceIds: [...f.evidenceIds, newEvidence.id],
            };
          }
          return f;
        })
      );

      addToast('success', `Uploaded ${file.name} to ${meta.facilityType}.`, 'Evidence Uploaded');
      logAuditAction(`Uploaded Infrastructure Evidence: ${meta.title}`, file.name, 'AI_SCAN', 'Info');

      return newEvidence;
    },
    [infrastructureEvidence, addToast, logAuditAction]
  );

  const resetToDemoData = () => {
    try {
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
        });
      }
    } catch (e) {}

    setApplications(SYNTHETIC_APPLICATIONS);
    setDocuments(initialLabeledDemoDocs);
    setComplianceRules(SYNTHETIC_COMPLIANCE_RULES);
    setInstitutions(SYNTHETIC_INSTITUTIONS);
    setReviewQueue(SYNTHETIC_REVIEW_QUEUE);
    setAuditLogs(SYNTHETIC_AUDIT_LOGS);
    setVerificationReports(SYNTHETIC_REPORTS);
    setNotifications(SYNTHETIC_NOTIFICATIONS);
    setBlindSpots(SYNTHETIC_BLIND_SPOTS);
    setSourceRegistries(SYNTHETIC_SOURCE_REGISTRIES);
    const fresh = getInitialClaimsAndBlindSpots();
    setClaims(fresh.claims);
    setBlindSpotRecords(fresh.blindSpots);
    const freshInfra = getInitialInfrastructureDataset();
    setFacilities(freshInfra.facilities);
    setInfrastructureEvidence(freshInfra.evidenceList);
    setMissingEvidenceList(freshInfra.missingEvidenceList);
    refreshBackendRecords();
    addToast('info', 'Demo datasets reset to initial synthetic benchmarks.', 'Reset Complete');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        darkMode,
        toggleDarkMode,
        currentRole,
        setCurrentRole,
        applications,
        documents,
        complianceRules,
        institutions,
        reviewQueue,
        auditLogs,
        verificationReports,
        notifications,
        stats,
        timeMachineScenarios,
        activeScenarioId,
        setActiveScenarioId,
        dependencyNodes,
        dependencyEdges,
        blindSpots,
        sourceRegistries,
        claims,
        blindSpotRecords,
        coverageSummary,
        manualVerificationModalOpen,
        setManualVerificationModalOpen,
        activeClaimForManualVerification,
        setActiveClaimForManualVerification,
        performManualClaimVerification,
        resolveBlindSpotRecord,
        triggerAuthorizedDemoProbe,
        facilities,
        infrastructureEvidence,
        missingEvidenceList,
        addEvidenceAnnotation,
        confirmAiAnnotation,
        deleteAnnotation,
        recordMissingEvidence,
        updateEvidenceReviewerVerdict,
        uploadInfrastructureEvidence,
        selectedApplicationId,
        setSelectedApplicationId,
        selectedDocumentId,
        setSelectedDocumentId,
        selectedInstitutionId,
        setSelectedInstitutionId,
        selectedReportId,
        setSelectedReportId,
        searchModalOpen,
        setSearchModalOpen,
        newAppModalOpen,
        setNewAppModalOpen,
        profileModalOpen,
        setProfileModalOpen,
        sihDemoModalOpen,
        setSihDemoModalOpen,
        toasts,
        addToast,
        removeToast,
        backendOnline,
        isUploading,
        uploadProgress,
        uploadError,
        uploadDocument,
        refreshBackendRecords,
        addApplication,
        updateApplicationStatus,
        issueDeficiencyNotice,
        verifyDocument,
        overrideTamperAlert,
        toggleRuleActive,
        logAuditAction,
        markNotificationRead,
        markAllNotificationsRead,
        addVerificationReport,
        resolveBlindSpot,
        pingSourceRegistry,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
