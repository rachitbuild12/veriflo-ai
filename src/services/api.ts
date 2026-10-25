export interface BackendVerificationFinding {
  rule_id: string;
  rule_name: string;
  clause: string;
  category: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Info';
  observed_value: string;
  expected_value: string;
  source_document: string;
  page_number: number;
  applicable_rule: string;
  recommended_action: string;
  passed: boolean;
}

export interface BackendTamperSignal {
  type: string;
  area: string;
  confidence: number;
  detail: string;
  severity: string;
  bounding_box?: Record<string, number>;
}

export interface BackendVerificationResult {
  id: string;
  file_name: string;
  file_hash_sha256: string;
  file_size_bytes: number;
  file_type: string;
  upload_timestamp: string;
  document_type: string;
  institution_id?: string;
  institution_name?: string;
  overall_status:
    | 'Verified (Compliant)'
    | 'Deficiency Flagged'
    | 'Tampering / Anomaly Suspected'
    | 'Officer Manual Review Needed';
  ai_confidence_score: number;
  is_synthetic: boolean;
  extracted_data: {
    institution_id?: string;
    institution_name?: string;
    application_type?: string;
    certificate_number?: string;
    document_type_detected?: string;
    faculty_members: Array<{
      name: string;
      qualification: string;
      designation: string;
      cadre: string;
      department?: string;
      page_ref?: number;
    }>;
    courses: Array<{
      name: string;
      level: string;
      approved_intake: number;
      page_ref?: number;
    }>;
    approved_intake_total?: number;
    dates: Record<string, string>;
    fee_amounts: Record<string, number>;
    fee_receipt_numbers: string[];
    document_references: string[];
    page_count: number;
    source_page_references: Record<string, number>;
    raw_text_summary?: string;
  };
  findings: BackendVerificationFinding[];
  tamper_signals: BackendTamperSignal[];
  alteration_indicators: any[];
  is_duplicate: boolean;
  duplicate_of?: string;
  metadata_summary: Record<string, any>;
  ocr_engine_used: string;
  forensic_summary: string;
}

export interface UploadOptions {
  documentType?: string;
  expectedPid?: string;
  institutionName?: string;
  previousApprovedIntake?: number;
  expectedFeeAmount?: number;
  applicationType?: string;
}

// ----------------- Simulation Types -----------------

export interface SimCourseItem {
  id: string;
  name: string;
  intake: number;
  level: string;
  is_nba_accredited: boolean;
}

export interface SimInstitutionProfile {
  pid: string;
  name: string;
  category: string;
  approved_intake_total: number;
  admitted_strength_total: number;
  total_faculty_count: number;
  professors_count: number;
  associate_professors_count: number;
  assistant_professors_count: number;
  phd_faculty_count: number;
  total_land_acres: number;
  total_builtup_area_sqm: number;
  classrooms_count: number;
  laboratories_count: number;
  computer_terminals: number;
  library_volumes: number;
  annual_budget_lakhs: number;
  courses: SimCourseItem[];
  has_architect_certificate: boolean;
  has_land_mutation_clearance: boolean;
  has_fire_safety_noc: boolean;
  has_university_affiliation: boolean;
  nba_accredited_programs_count: number;
}

export interface SimCheckResult {
  rule_id: string;
  clause: string;
  title: string;
  category: string;
  severity: 'Critical' | 'Major' | 'Minor';
  rule_version: string;
  is_illustrative_demo_rule: boolean;
  rule_label: string;
  baseline_value: string;
  proposed_value: string;
  benchmark_threshold: string;
  baseline_passed: boolean | null;
  proposed_passed: boolean | null;
  transition: 'PASS_TO_FAIL' | 'FAIL_TO_PASS' | 'PASS_TO_PASS' | 'FAIL_TO_FAIL' | 'UNRESOLVED_ASSUMPTION';
  transition_label: string;
  explanation: string;
  required_evidence: string;
  affected_records: string[];
  is_assumption: boolean;
}

export interface SimDependencyCascade {
  driver_parameter: string;
  delta: string;
  impacted_domain: string;
  requirement_summary: string;
  affected_asset: string;
  recommended_procurement: string;
}

export interface SimReport {
  scenario_id: string;
  scenario_name: string;
  rule_version: string;
  rule_version_name: string;
  baseline_pid: string;
  baseline_name: string;
  created_at: string;
  disclaimer: string;
  metric_deltas: Record<string, { baseline: number; proposed: number; delta: number }>;
  transition_counts: Record<string, number>;
  checks: SimCheckResult[];
  dependency_cascade: SimDependencyCascade[];
  overall_feasibility: 'Feasible' | 'Remediation Required' | 'High Risk / Severe Deficits';
  summary_verdict: string;
}

export interface RuleVersionOption {
  code: string;
  name: string;
  sfr_ratio: number;
  cadre_ratio_str: string;
  space_per_student: number;
  computers_per_student: number;
  max_expansion_without_nba: number;
  description: string;
}

const API_BASE = 'http://127.0.0.1:8000/api';

export const checkBackendHealth = async (): Promise<{
  online: boolean;
  data?: any;
}> => {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, data };
  } catch {
    return { online: false };
  }
};

export const fetchVerificationRecords = async (): Promise<BackendVerificationResult[]> => {
  try {
    const res = await fetch(`${API_BASE}/verification/results`, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch backend verification records:', err);
    return [];
  }
};

export const uploadAndVerifyDocument = (
  file: File,
  options: UploadOptions = {},
  onProgress?: (progressPercent: number) => void
): Promise<BackendVerificationResult> => {
  return new Promise((resolve, reject) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      return reject(new Error(`Unsupported file type '${ext}'. Please upload PDF, PNG, or JPEG.`));
    }
    if (file.size > 25 * 1024 * 1024) {
      return reject(new Error('File exceeds the 25MB maximum upload limit.'));
    }

    const formData = new FormData();
    formData.append('file', file);
    if (options.documentType) formData.append('document_type', options.documentType);
    if (options.expectedPid) formData.append('expected_pid', options.expectedPid);
    if (options.institutionName) formData.append('institution_name', options.institutionName);
    if (options.previousApprovedIntake)
      formData.append('previous_approved_intake', options.previousApprovedIntake.toString());
    if (options.expectedFeeAmount)
      formData.append('expected_fee_amount', options.expectedFeeAmount.toString());
    if (options.applicationType)
      formData.append('application_type', options.applicationType);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/documents/upload`, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.data);
        } catch {
          reject(new Error('Invalid JSON response returned by verification server.'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.detail || `Upload failed with status code ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status code ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error: Unable to reach FastAPI Verification Engine at 127.0.0.1:8000. Please ensure the backend server is running.'));
    };

    xhr.send(formData);
  });
};

// ----------------- Simulator API Functions -----------------

export const fetchSimulatorRulesets = async (): Promise<RuleVersionOption[]> => {
  try {
    const res = await fetch(`${API_BASE}/simulator/rulesets`, { method: 'GET' });
    if (!res.ok) throw new Error('Failed to load rulesets');
    return await res.json();
  } catch (err) {
    console.warn('Fallback to local rulesets:', err);
    return [
      {
        code: 'v2024_25',
        name: 'AICTE APH 2024-25 (v3.2 Baseline)',
        sfr_ratio: 20.0,
        cadre_ratio_str: '1:2:6',
        space_per_student: 4.0,
        computers_per_student: 0.2,
        max_expansion_without_nba: 120,
        description: 'Baseline norms for 2024-25 cycle with standard 1:20 Student-Faculty Ratio.',
      },
      {
        code: 'v2025_26',
        name: 'AICTE APH 2025-26 (v4.0 Current Benchmark)',
        sfr_ratio: 20.0,
        cadre_ratio_str: '1:2:6',
        space_per_student: 4.0,
        computers_per_student: 0.25,
        max_expansion_without_nba: 120,
        description: 'Current standard framework with enhanced computing requirements for emerging tech.',
      },
      {
        code: 'v2026_27',
        name: 'AICTE APH 2026-27 (v4.2 Draft Projected Norms)',
        sfr_ratio: 15.0,
        cadre_ratio_str: '1:2:6',
        space_per_student: 4.5,
        computers_per_student: 0.33,
        max_expansion_without_nba: 60,
        description: 'Projected regulatory drift incorporating stricter 1:15 SFR and expanded instructional spaces.',
      },
    ];
  }
};

export const evaluateSimulation = async (
  baseline: SimInstitutionProfile,
  proposed: SimInstitutionProfile,
  ruleVersion: string = 'v2025_26',
  scenarioName: string = 'Proposed Institutional Expansion'
): Promise<SimReport> => {
  try {
    const res = await fetch(`${API_BASE}/simulator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseline,
        proposed,
        rule_version: ruleVersion,
        scenario_name: scenarioName,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Evaluation request failed');
    }
    return await res.json();
  } catch (err) {
    console.warn('Backend evaluation call failed, using client simulator fallback:', err);
    return runClientFallbackSimulation(baseline, proposed, ruleVersion, scenarioName);
  }
};

export const saveSimulationScenario = async (report: SimReport): Promise<{ scenario_id: string }> => {
  try {
    const res = await fetch(`${API_BASE}/simulator/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!res.ok) throw new Error('Save scenario failed');
    return await res.json();
  } catch {
    // Save to localStorage as seamless fallback
    const key = `VERIFLO_SCENARIO_${report.scenario_id}`;
    localStorage.setItem(key, JSON.stringify(report));
    return { scenario_id: report.scenario_id };
  }
};

export const fetchSavedScenarios = async (): Promise<SimReport[]> => {
  try {
    const res = await fetch(`${API_BASE}/simulator/saved-scenarios`, { method: 'GET' });
    if (!res.ok) throw new Error('Fetch saved scenarios failed');
    return await res.json();
  } catch {
    // Load from localStorage
    const saved: SimReport[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('VERIFLO_SCENARIO_')) {
        try {
          saved.push(JSON.parse(localStorage.getItem(k)!));
        } catch {}
      }
    }
    return saved;
  }
};

// ----------------- Client-side Simulator Engine Fallback -----------------

function runClientFallbackSimulation(
  b: SimInstitutionProfile,
  p: SimInstitutionProfile,
  vCode: string,
  scenarioName: string
): SimReport {
  const sfrRatio = vCode === 'v2026_27' ? 15.0 : 20.0;
  const spacePerStudent = vCode === 'v2026_27' ? 4.5 : 4.0;
  const compRatio = vCode === 'v2026_27' ? 0.33 : vCode === 'v2025_26' ? 0.25 : 0.20;
  const maxExpansion = vCode === 'v2026_27' ? 60 : 120;

  const checks: SimCheckResult[] = [];

  // 1. SFR
  const bReqFac = Math.round((b.approved_intake_total * 4) / sfrRatio);
  const pReqFac = Math.round((p.approved_intake_total * 4) / sfrRatio);
  const bSfrPass = b.total_faculty_count >= bReqFac;
  const pSfrPass = p.total_faculty_count >= pReqFac;
  checks.push({
    rule_id: 'RULE-SIM-SFR-01',
    clause: 'APH Ch.7 Clause 1.2 - Student-to-Faculty Ratio Norm',
    title: 'Student-to-Faculty Ratio (SFR) Compliance',
    category: 'Faculty Norms',
    severity: 'Critical',
    rule_version: vCode,
    is_illustrative_demo_rule: true,
    rule_label: '[Illustrative Demo Rule - Simulation Benchmark]',
    baseline_value: `${b.total_faculty_count} faculty (${b.approved_intake_total * 4} students, 1:${((b.approved_intake_total * 4) / Math.max(b.total_faculty_count, 1)).toFixed(1)})`,
    proposed_value: `${p.total_faculty_count} faculty (${p.approved_intake_total * 4} students, 1:${((p.approved_intake_total * 4) / Math.max(p.total_faculty_count, 1)).toFixed(1)})`,
    benchmark_threshold: `Min ${pReqFac} faculty for ${p.approved_intake_total * 4} students (Benchmark SFR 1:${sfrRatio})`,
    baseline_passed: bSfrPass,
    proposed_passed: pSfrPass,
    transition: getTrans(bSfrPass, pSfrPass),
    transition_label: getTransLabel(getTrans(bSfrPass, pSfrPass)),
    explanation: `An annual intake of ${p.approved_intake_total} generates ${p.approved_intake_total * 4} students requiring at least ${pReqFac} faculty at 1:${sfrRatio} SFR.`,
    required_evidence: 'Institutional Faculty Roster, Form-16 Salary Statements, University Selection Minutes.',
    affected_records: ['Faculty Register', 'Statutory Salary Ledger'],
    is_assumption: false,
  });

  // 2. Cadre
  const pReqProf = Math.max(1, Math.floor(p.total_faculty_count / 9));
  const pReqAssoc = Math.max(2, Math.floor((p.total_faculty_count * 2) / 9));
  const bCadrePass = b.professors_count >= Math.max(1, Math.floor(b.total_faculty_count / 9)) && b.associate_professors_count >= Math.max(2, Math.floor((b.total_faculty_count * 2) / 9));
  const pCadrePass = p.professors_count >= pReqProf && p.associate_professors_count >= pReqAssoc;
  checks.push({
    rule_id: 'RULE-SIM-CAD-02',
    clause: 'APH Ch.7 Clause 2.3 - Cadre Proportion Norm (1:2:6)',
    title: 'Senior Cadre Distribution Proportion',
    category: 'Faculty Norms',
    severity: 'Major',
    rule_version: vCode,
    is_illustrative_demo_rule: true,
    rule_label: '[Illustrative Demo Rule - Simulation Benchmark]',
    baseline_value: `${b.professors_count} Prof, ${b.associate_professors_count} Assoc Prof, ${b.assistant_professors_count} Asst Prof`,
    proposed_value: `${p.professors_count} Prof, ${p.associate_professors_count} Assoc Prof, ${p.assistant_professors_count} Asst Prof`,
    benchmark_threshold: `Min ${pReqProf} Prof and ${pReqAssoc} Assoc Prof for ${p.total_faculty_count} faculty`,
    baseline_passed: bCadrePass,
    proposed_passed: pCadrePass,
    transition: getTrans(bCadrePass, pCadrePass),
    transition_label: getTransLabel(getTrans(bCadrePass, pCadrePass)),
    explanation: `Cadre proportion mandates 1 Professor : 2 Associate Professors : 6 Assistant Professors.`,
    required_evidence: 'Cadre endorsement orders and University approval minutes.',
    affected_records: ['Faculty Cadre Schedule'],
    is_assumption: false,
  });

  // 3. Ph.D.
  const bSeniors = b.professors_count + b.associate_professors_count;
  const pSeniors = p.professors_count + p.associate_professors_count;
  const bPhdPass = b.phd_faculty_count >= bSeniors;
  const pPhdPass = p.phd_faculty_count >= pSeniors;
  checks.push({
    rule_id: 'RULE-SIM-PHD-03',
    clause: 'APH Ch.7 Clause 2.1 - Doctoral Qualifications',
    title: 'Ph.D. Qualifications for Senior Cadre',
    category: 'Faculty Norms',
    severity: 'Critical',
    rule_version: vCode,
    is_illustrative_demo_rule: true,
    rule_label: '[Illustrative Demo Rule - Simulation Benchmark]',
    baseline_value: `${b.phd_faculty_count} Ph.D. holders out of ${bSeniors} senior faculty`,
    proposed_value: `${p.phd_faculty_count} Ph.D. holders out of ${pSeniors} senior faculty`,
    benchmark_threshold: `100% Ph.D. mandatory for senior cadre (${pSeniors} required)`,
    baseline_passed: bPhdPass,
    proposed_passed: pPhdPass,
    transition: getTrans(bPhdPass, pPhdPass),
    transition_label: getTransLabel(getTrans(bPhdPass, pPhdPass)),
    explanation: 'Every appointment as Professor or Associate Professor legally requires a recognized doctoral degree.',
    required_evidence: 'UGC recognized University Doctoral Degree Certificates.',
    affected_records: ['Academic Credential Ledger'],
    is_assumption: false,
  });

  // 4. Built-up Area
  const pReqArea = p.approved_intake_total * 4 * spacePerStudent;
  const bReqArea = b.approved_intake_total * 4 * spacePerStudent;
  const bAreaPass = b.total_builtup_area_sqm >= bReqArea;
  const pAreaPass = p.total_builtup_area_sqm >= pReqArea;
  checks.push({
    rule_id: 'RULE-SIM-BLD-04',
    clause: 'APH Ch.4 Clause 1.1 - Built-up Area Adequacy',
    title: 'Total Built-up Area Adequacy',
    category: 'Infrastructure Norms',
    severity: 'Critical',
    rule_version: vCode,
    is_illustrative_demo_rule: true,
    rule_label: '[Illustrative Demo Rule - Simulation Benchmark]',
    baseline_value: `${b.total_builtup_area_sqm.toLocaleString()} sq.m`,
    proposed_value: `${p.total_builtup_area_sqm.toLocaleString()} sq.m`,
    benchmark_threshold: `Min ${pReqArea.toLocaleString()} sq.m (${spacePerStudent} sq.m/student)`,
    baseline_passed: bAreaPass,
    proposed_passed: pAreaPass,
    transition: getTrans(bAreaPass, pAreaPass),
    transition_label: getTransLabel(getTrans(bAreaPass, pAreaPass)),
    explanation: `Total instructional and administrative built-up space must meet ${spacePerStudent} sq.m per student.`,
    required_evidence: 'Registered Architect Built-up Certificate & Municipal Building Sanction.',
    affected_records: ['Campus Master Plan'],
    is_assumption: false,
  });

  // 5. Land Area
  const bLandPass = b.total_land_acres >= 2.5;
  const pLandPass = p.total_land_acres >= 2.5;
  checks.push({
    rule_id: 'RULE-SIM-LND-05',
    clause: 'APH Ch.4 Clause 1.3 - Contiguous Land Area',
    title: 'Contiguous Campus Land Area',
    category: 'Infrastructure Norms',
    severity: 'Major',
    rule_version: vCode,
    is_illustrative_demo_rule: true,
    rule_label: '[Illustrative Demo Rule - Simulation Benchmark]',
    baseline_value: `${b.total_land_acres} acres`,
    proposed_value: `${p.total_land_acres} acres`,
    benchmark_threshold: 'Min 2.5 acres contiguous titled land',
    baseline_passed: bLandPass,
    proposed_passed: pLandPass,
    transition: getTrans(bLandPass, pLandPass),
    transition_label: getTransLabel(getTrans(bLandPass, pLandPass)),
    explanation: 'Campus title must be clear and contiguous without public right-of-way bifurcation.',
    required_evidence: 'Land Deed & SDM Non-Encumbrance Certificate.',
    affected_records: ['Land Title Deed'],
    is_assumption: false,
  });

  // 6. Classrooms
  const pReqCls = Math.max(4, Math.round((p.approved_intake_total * 4) / 45));
  const bReqCls = Math.max(4, Math.round((b.approved_intake_total * 4) / 45));
  const bClsPass = b.classrooms_count >= bReqCls;
  const pClsPass = p.classrooms_count >= pReqCls;
  checks.push({
    rule_id: 'RULE-SIM-CLS-06',
    clause: 'APH Ch.4 Clause 2.1 - Classroom Allocation',
    title: 'Instructional Classrooms Allocation',
    category: 'Infrastructure Norms',
    severity: 'Major',
    rule_version: vCode,
    is_illustrative_demo_rule: true,
    rule_label: '[Illustrative Demo Rule - Simulation Benchmark]',
    baseline_value: `${b.classrooms_count} classrooms`,
    proposed_value: `${p.classrooms_count} classrooms`,
    benchmark_threshold: `Min ${pReqCls} classrooms for ${p.approved_intake_total} intake`,
    baseline_passed: bClsPass,
    proposed_passed: pClsPass,
    transition: getTrans(bClsPass, pClsPass),
    transition_label: getTransLabel(getTrans(bClsPass, pClsPass)),
    explanation: `Classroom allocation must accommodate all batch divisions simultaneously with ICT projection.`,
    required_evidence: 'Room Allocation Schedule endorsed by chartered architect.',
    affected_records: ['Room Allocation Register'],
    is_assumption: false,
  });

  // 7. Computing Terminals
  const pReqComp = Math.round(p.approved_intake_total * 4 * compRatio);
  const bReqComp = Math.round(b.approved_intake_total * 4 * compRatio);
  const bCompPass = b.computer_terminals >= bReqComp;
  const pCompPass = p.computer_terminals >= pReqComp;
  checks.push({
    rule_id: 'RULE-SIM-CMP-07',
    clause: 'APH Ch.5 Clause 1.4 - Computing Facilities',
    title: 'Computing Center & Laboratory Terminals',
    category: 'Instructional Resources',
    severity: 'Major',
    rule_version: vCode,
    is_illustrative_demo_rule: true,
    rule_label: '[Illustrative Demo Rule - Simulation Benchmark]',
    baseline_value: `${b.computer_terminals} terminals`,
    proposed_value: `${p.computer_terminals} terminals`,
    benchmark_threshold: `Min ${pReqComp} terminals (1 per ${Math.round(1 / compRatio)} students)`,
    baseline_passed: bCompPass,
    proposed_passed: pCompPass,
    transition: getTrans(bCompPass, pCompPass),
    transition_label: getTransLabel(getTrans(bCompPass, pCompPass)),
    explanation: `Demands high-performance desktop nodes on campus LAN with legal licenses.`,
    required_evidence: 'Hardware Invoices & Volume Software Licenses.',
    affected_records: ['IT Hardware Asset Inventory'],
    is_assumption: false,
  });

  // 8. Expansion Cap
  const intakeDelta = p.approved_intake_total - b.approved_intake_total;
  let pExpPass = true;
  if (intakeDelta > maxExpansion) {
    pExpPass = p.nba_accredited_programs_count >= 2;
  }
  checks.push({
    rule_id: 'RULE-SIM-EXP-09',
    clause: 'APH Ch.2 Clause 4.2 - Annual Expansion Cap',
    title: 'Single-Cycle Seat Expansion Cap & NBA Requirement',
    category: 'Academic Approvals',
    severity: 'Critical',
    rule_version: vCode,
    is_illustrative_demo_rule: true,
    rule_label: '[Illustrative Demo Rule - Simulation Benchmark]',
    baseline_value: `${b.approved_intake_total} seats`,
    proposed_value: `${p.approved_intake_total} seats (+${intakeDelta} delta)`,
    benchmark_threshold: `Max +${maxExpansion} seats without mandatory NBA accreditation`,
    baseline_passed: true,
    proposed_passed: pExpPass,
    transition: getTrans(true, pExpPass),
    transition_label: getTransLabel(getTrans(true, pExpPass)),
    explanation: `Expansions beyond +${maxExpansion} seats require active NBA accreditation.`,
    required_evidence: 'National Board of Accreditation (NBA) Certificate.',
    affected_records: ['NBA Accreditation Portfolio'],
    is_assumption: false,
  });

  // 9. Assumptions Check
  const hasAssumptions = !p.has_architect_certificate || !p.has_land_mutation_clearance || !p.has_fire_safety_noc;
  checks.push({
    rule_id: 'RULE-SIM-ASM-10',
    clause: 'APH Ch.1 Clause 4.1 - Evidence Verification',
    title: 'Statutory Evidence Verification & Assumption Flags',
    category: 'Documentation Integrity',
    severity: 'Major',
    rule_version: vCode,
    is_illustrative_demo_rule: true,
    rule_label: '[Illustrative Demo Rule - Simulation Benchmark]',
    baseline_value: 'All baseline evidence documented in existing records',
    proposed_value: hasAssumptions ? 'Simulation depends on unverified assumptions' : 'All evidence verified',
    benchmark_threshold: 'All physical expansions must be backed by verified statutory documentation',
    baseline_passed: true,
    proposed_passed: hasAssumptions ? null : true,
    transition: hasAssumptions ? 'UNRESOLVED_ASSUMPTION' : 'PASS_TO_PASS',
    transition_label: hasAssumptions ? 'Unresolved Assumption (Missing Evidence)' : 'Remains Compliant',
    explanation: hasAssumptions
      ? 'Scenario relies on assumed readiness: unverified land mutation or architect certificate. Outcomes are conditional.'
      : 'All statutory documents confirmed.',
    required_evidence: 'State Fire NOC, Registered Architect Certificate, Affiliation Sanction.',
    affected_records: ['Pending Evidence Queue'],
    is_assumption: hasAssumptions,
  });

  const transitionCounts = {
    PASS_TO_FAIL: checks.filter((c) => c.transition === 'PASS_TO_FAIL').length,
    FAIL_TO_PASS: checks.filter((c) => c.transition === 'FAIL_TO_PASS').length,
    PASS_TO_PASS: checks.filter((c) => c.transition === 'PASS_TO_PASS').length,
    FAIL_TO_FAIL: checks.filter((c) => c.transition === 'FAIL_TO_FAIL').length,
    UNRESOLVED_ASSUMPTION: checks.filter((c) => c.transition === 'UNRESOLVED_ASSUMPTION').length,
  };

  const cascade: SimDependencyCascade[] = [];
  if (intakeDelta !== 0) {
    const addFac = Math.round((intakeDelta * 4) / sfrRatio);
    cascade.push({
      driver_parameter: 'Approved Intake Total',
      delta: `${intakeDelta > 0 ? '+' : ''}${intakeDelta} seats`,
      impacted_domain: 'Faculty Recruitment & Cadre',
      requirement_summary: `Requires ${addFac > 0 ? '+' : ''}${addFac} full-time faculty to maintain SFR 1:${sfrRatio}.`,
      affected_asset: 'Institutional Payroll & Faculty Roster',
      recommended_procurement: `Advertise recruitment for ${Math.max(1, Math.floor(addFac / 9))} Professor(s) and ${Math.max(1, Math.floor(addFac / 4))} Associate Professor(s).`,
    });

    const addSqm = intakeDelta * 4 * spacePerStudent;
    cascade.push({
      driver_parameter: 'Approved Intake Total',
      delta: `${intakeDelta > 0 ? '+' : ''}${intakeDelta} seats`,
      impacted_domain: 'Instructional Built-up Space',
      requirement_summary: `Demands ${addSqm > 0 ? '+' : ''}${Math.round(addSqm).toLocaleString()} sq.m additional built-up space.`,
      affected_asset: 'Campus Physical Infrastructure',
      recommended_procurement: 'Construct instructional wings with chartered architect endorsement.',
    });
  }

  const passToFail = transitionCounts.PASS_TO_FAIL;
  const overallFeasibility =
    passToFail > 1 ? 'High Risk / Severe Deficits' : passToFail === 1 || transitionCounts.UNRESOLVED_ASSUMPTION > 0 ? 'Remediation Required' : 'Feasible';

  return {
    scenario_id: `SIM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    scenario_name: scenarioName,
    rule_version: vCode,
    rule_version_name: vCode === 'v2026_27' ? 'AICTE APH 2026-27 (v4.2 Draft)' : vCode === 'v2024_25' ? 'AICTE APH 2024-25 (v3.2 Baseline)' : 'AICTE APH 2025-26 (v4.0 Current)',
    baseline_pid: b.pid,
    baseline_name: b.name,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    disclaimer:
      'SIMULATION SANDBOX ONLY — Scenario simulation never mutates official institutional records, registers live applications, or grants regulatory approvals. All rules are explicitly labeled illustrative demo rules until verified regulatory requirements are configured.',
    metric_deltas: {
      intake: { baseline: b.approved_intake_total, proposed: p.approved_intake_total, delta: intakeDelta },
      faculty: { baseline: b.total_faculty_count, proposed: p.total_faculty_count, delta: p.total_faculty_count - b.total_faculty_count },
      builtup_area: { baseline: b.total_builtup_area_sqm, proposed: p.total_builtup_area_sqm, delta: p.total_builtup_area_sqm - b.total_builtup_area_sqm },
      classrooms: { baseline: b.classrooms_count, proposed: p.classrooms_count, delta: p.classrooms_count - b.classrooms_count },
      courses_count: { baseline: b.courses.length, proposed: p.courses.length, delta: p.courses.length - b.courses.length },
    },
    transition_counts: transitionCounts,
    checks,
    dependency_cascade: cascade,
    overall_feasibility: overallFeasibility,
    summary_verdict:
      passToFail > 0
        ? `Proposed changes introduce ${passToFail} new non-compliance deficit(s). Targeted remediation needed.`
        : `All ${checks.length} illustrative regulatory benchmarks satisfied in proposed scenario.`,
  };
}

function getTrans(b: boolean | null, p: boolean | null): SimCheckResult['transition'] {
  if (b === true && p === false) return 'PASS_TO_FAIL';
  if (b === false && p === true) return 'FAIL_TO_PASS';
  if (b === true && p === true) return 'PASS_TO_PASS';
  if (b === false && p === false) return 'FAIL_TO_FAIL';
  return 'UNRESOLVED_ASSUMPTION';
}

function getTransLabel(t: SimCheckResult['transition']): string {
  const map: Record<string, string> = {
    PASS_TO_FAIL: 'New Deficit Created (Pass -> Fail)',
    FAIL_TO_PASS: 'Deficiency Remediated (Fail -> Pass)',
    PASS_TO_PASS: 'Remains Compliant (Pass -> Pass)',
    FAIL_TO_FAIL: 'Unresolved Deficit (Fail -> Fail)',
    UNRESOLVED_ASSUMPTION: 'Unresolved Assumption (Missing Data)',
  };
  return map[t] || t;
}
