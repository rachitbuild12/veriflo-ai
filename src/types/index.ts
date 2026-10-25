export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under AI Scrutiny'
  | 'Level 2: Scrutiny Committee'
  | 'Deficiencies Communicated'
  | 'Hearing / Appellate'
  | 'EVC Physical Inspection'
  | 'Approved / EoA Issued'
  | 'Rejected';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Severe';

export type InstitutionType =
  | 'Government'
  | 'Govt-Aided'
  | 'Private-Autonomous'
  | 'Self-Financing'
  | 'Central University'
  | 'Deemed to be University';

export type DisciplineCategory =
  | 'Engineering & Technology'
  | 'Management (MBA/PGDM)'
  | 'Pharmacy'
  | 'MCA & Computer Applications'
  | 'Architecture & Planning'
  | 'Polytechnic Diploma';

export type AICTEJurisdiction =
  | 'Western (WRO)'
  | 'Northern (NRO)'
  | 'Southern (SRO)'
  | 'South-Western (SWRO)'
  | 'Eastern (ERO)'
  | 'Central (CRO)'
  | 'North-Western (NWRO)';

export type NavigationTab =
  | 'overview'
  | 'applications'
  | 'document-verification'
  | 'infrastructure-review'
  | 'compliance-time-machine'
  | 'evidence-dependency-graph'
  | 'blind-spot-detector'
  | 'compliance-rules'
  | 'institution-records'
  | 'review-queue'
  | 'verification-reports'
  | 'audit-trail'
  | 'settings';

export interface ProgramIntake {
  id: string;
  name: string;
  level: 'UG' | 'PG' | 'Diploma' | 'Integrated';
  intake: number;
  nbaAccredited: boolean;
  sanctionedYear: number;
}

export interface DeficiencyNotice {
  id: string;
  clauseCode: string;
  category: string;
  issueDescription: string;
  severity: 'Critical' | 'Major' | 'Minor';
  issuedDate: string;
  complianceDeadline: string;
  status: 'Pending Response' | 'Resolved' | 'Contested by Institute' | 'Hearing Scheduled';
  officerRemarks?: string;
  instituteResponse?: string;
}

export interface Application {
  id: string;
  applicationNumber: string;
  pid: string; // Permanent Institute ID
  institutionName: string;
  institutionType: InstitutionType;
  category: DisciplineCategory;
  region: AICTEJurisdiction;
  state: string;
  city: string;
  academicYear: string;
  applicationType:
    | 'Extension of Approval (EoA)'
    | 'New Institution Setup'
    | 'Increase in Intake / New Course'
    | 'Introduction of Supernumerary Quota'
    | 'Closure of Course';
  submittedDate: string;
  status: ApplicationStatus;
  overallRiskLevel: RiskLevel;
  deficienciesCount: number;
  assignedOfficer: string;
  currentStage:
    | 'Level 1: AI Scrutiny & OCR'
    | 'Level 2: Scrutiny Committee'
    | 'Level 3: EVC / Virtual Visit'
    | 'Level 4: Approval Bureau (HQ)'
    | 'Completed';
  lastUpdated: string;
  programs: ProgramIntake[];
  deficiencyNotices: DeficiencyNotice[];
  landAreaAcres: number;
  builtUpAreaSqM: number;
  activeFacultyCount: number;
  studentStrength: number;
}

export interface TamperSignal {
  type: 'Font Inconsistency' | 'Metadata Mismatch' | 'Stamp Anomaly' | 'Erasure / Overwrite' | 'Date Expiry Conflict';
  area: string;
  confidence: number;
  detail: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface DocumentVerificationItem {
  id: string;
  applicationId: string;
  institutionName: string;
  documentType:
    | 'Land Title Deed & Mutation Certificate'
    | 'Architect Built-up Area Certificate'
    | 'Fire & Life Safety NOC (Form B)'
    | 'State Pollution Control Board NOC'
    | 'Faculty Cadre & Form-16 List'
    | 'University Affiliation Letter'
    | 'Barrier-free Divyangjan Ramp Certificate'
    | 'Audited Balance Sheet & Corpus FD'
    | 'Occupancy / Completion Certificate';
  fileName: string;
  uploadedAt: string;
  fileSize: string;
  aiConfidenceScore: number;
  verificationStatus:
    | 'Verified (Compliant)'
    | 'Deficiency Flagged'
    | 'Tampering / Forgery Suspected'
    | 'Officer Manual Review Needed';
  extractedEntities: Record<string, string | number>;
  deficiencyFindings: Array<{
    clause: string;
    message: string;
    severity: 'Critical' | 'Major' | 'Minor';
  }>;
  tamperSignals: TamperSignal[];
  scrutinyRemarks: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  officerOverride?: {
    overriddenBy: string;
    reason: string;
    timestamp: string;
  };
  isSynthetic?: boolean;
  sha256Hash?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  ocrEngineUsed?: string;
  structuredFindings?: Array<{
    rule_id: string;
    rule_name: string;
    clause: string;
    category: string;
    severity: 'Critical' | 'Major' | 'Minor' | 'Info';
    observed_value: string;
    expected_value: string;
    source_document: string;
    page_number?: number;
    applicable_rule: string;
    recommended_action: string;
    passed: boolean;
  }>;
  rawExtractedData?: any;
}

export interface ComplianceRule {
  id: string;
  clauseCode: string;
  chapter: string;
  category:
    | 'Faculty & Cadre Norms'
    | 'Land & Built-up Area'
    | 'Statutory NOCs & Safety'
    | 'Instructional Facilities'
    | 'Inclusive Infrastructure'
    | 'Financial Soundness';
  title: string;
  description: string;
  normRequirement: string;
  penaltyClause: string;
  automatedCheck: boolean;
  isActive: boolean;
  lastAmended: string;
}

export interface InstitutionRecord {
  id: string;
  pid: string;
  name: string;
  type: InstitutionType;
  category: DisciplineCategory;
  state: string;
  city: string;
  region: AICTEJurisdiction;
  establishedYear: number;
  principalName: string;
  contactEmail: string;
  naacGrade: 'A++' | 'A+' | 'A' | 'B++' | 'B+' | 'Not Accredited';
  nirfBand: string;
  overallComplianceScore: number;
  approvedIntakeTotal: number;
  admittedStrengthTotal: number;
  totalFacultyCount: number;
  totalLandAcres: number;
  totalBuiltUpAreaSqM: number;
  status: 'Compliant' | 'Deficiencies Outstanding' | 'Under Inspection' | 'Notice Issued';
  lastEoAIssued: string;
}

export interface ReviewQueueItem {
  id: string;
  applicationId: string;
  institutionName: string;
  pid: string;
  region: AICTEJurisdiction;
  priority: 'Urgent' | 'High' | 'Normal';
  daysInQueue: number;
  stage: string;
  flagReason: string;
  aiRiskScore: number;
  recommendedAction: string;
  assignedTo: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  ipAddress: string;
  action: string;
  targetEntity: string;
  category: 'AI_SCAN' | 'OFFICER_OVERRIDE' | 'STATUS_CHANGE' | 'DEFICIENCY_NOTICE' | 'RULE_UPDATE' | 'EOA_GENERATION';
  severity: 'Info' | 'Warning' | 'Critical';
  hash: string;
}

export interface VerificationReport {
  id: string;
  reportNumber: string;
  applicationId: string;
  institutionName: string;
  pid: string;
  generatedDate: string;
  reportType:
    | 'Deficiency Assessment Report'
    | 'Scrutiny Committee Summary'
    | 'Expert Visit Committee (EVC) Findings'
    | 'Final Extension of Approval (EoA) Order';
  verdict:
    | 'Recommended for Approval'
    | 'Approved with 15-day Rectification'
    | 'Escalated to Standing Appellate Committee'
    | 'Not Recommended (Severe Deficiencies)';
  evaluatorName: string;
  evaluatorDesignation: string;
  downloadUrl?: string;
  summaryMetrics: {
    totalNormsChecked: number;
    normsSatisfied: number;
    minorDeficiencies: number;
    criticalViolations: number;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'deficiency' | 'tamper' | 'system' | 'deadline';
  read: boolean;
  linkRoute?: string;
  linkParam?: string;
}

export type OfficerRole =
  | 'Regional Scrutiny Officer (WRO)'
  | 'Senior Director (Approval Bureau)'
  | 'Standing Appellate Committee Member'
  | 'System Auditor / Vigilance Officer';

// --- NEW COMPREHENSIVE GOVTECH TYPES ---

export interface TimeMachineScenario {
  id: string;
  name: string;
  horizon: '30_DAYS' | '90_DAYS' | '180_DAYS' | 'NEXT_ACADEMIC_YEAR';
  horizonLabel: string;
  description: string;
  simulatedChanges: string[];
  impactSummary: {
    atRiskInstitutionsCount: number;
    projectedCriticalFlags: number;
    projectedNonComplianceRate: number;
    highestRiskCategory: string;
  };
  institutionProjections: Array<{
    institutionId: string;
    institutionName: string;
    pid: string;
    currentScore: number;
    projectedScore: number;
    imminentDeficiency: string;
    riskTrend: 'High' | 'Severe' | 'Moderate' | 'Stable';
    recommendedPreventativeAction: string;
  }>;
}

export interface DependencyNode {
  id: string;
  label: string;
  type: 'APPLICATION' | 'DOCUMENT' | 'AUTHORITY' | 'REGULATORY_NORM' | 'INFRASTRUCTURE';
  status: 'VERIFIED' | 'TAMPER_ALERT' | 'UNVERIFIED' | 'EXPIRED' | 'CRITICAL_DEFICIT';
  confidenceScore?: number;
  metadata?: Record<string, string | number>;
  sourceInstitution: string;
  details: string;
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'VALIDATES' | 'DEPENDS_ON' | 'ISSUED_BY' | 'CONSTRAINS' | 'COMPROMISES';
  isBroken?: boolean;
  notes?: string;
}

export interface BlindSpotItem {
  id: string;
  category:
    | 'GHOST_FACULTY_OVERLAP'
    | 'SINGLE_POINT_VERIFICATION'
    | 'UNREGISTERED_PARCEL'
    | 'UNCHECKED_MUNICIPAL_STATUS'
    | 'EXPIRED_THIRD_PARTY_AUDIT';
  severity: 'Critical' | 'High' | 'Medium';
  title: string;
  institutionName: string;
  pid: string;
  unverifiedAssertion: string;
  identifiedRisk: string;
  confidenceGap: number; // e.g. 78% confidence gap
  recommendedProbe: string;
  status: 'Open Gap' | 'Cross-Checked' | 'Audit Scheduled';
  sourceRegistryMissing: string;
}

export interface SourceRegistryStatus {
  id: string;
  sourceName: string;
  authority: string;
  type:
    | 'DigiLocker / NAD'
    | 'State Land Mutation Portal'
    | 'Chief Fire Office'
    | 'EPFO / TRRN 26AS'
    | 'Council of Architecture (CoA)'
    | 'Affiliating University API';
  verifiedCount: number;
  flaggedCount: number;
  latencyMs: number;
  status: 'Online' | 'Synchronized' | 'Intermittent';
  lastPing: string;
  uptimePercentage: number;
}
