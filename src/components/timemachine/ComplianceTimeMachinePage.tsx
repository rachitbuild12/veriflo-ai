import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Download,
  Eye,
  FastForward,
  FileCheck2,
  FileSearch,
  FileText,
  Filter,
  Flame,
  FolderOpen,
  GitCompare,
  GraduationCap,
  History,
  Info,
  Layers,
  Network,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Scale,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TimeMachineScenario, InstitutionRecord } from '../../types';
import { Badge } from '../common/Badge';
import {
  SimInstitutionProfile,
  SimReport,
  RuleVersionOption,
  fetchSimulatorRulesets,
  evaluateSimulation,
  saveSimulationScenario,
  fetchSavedScenarios,
} from '../../services/api';

export const ComplianceTimeMachinePage: React.FC = () => {
  const {
    institutions,
    timeMachineScenarios,
    addToast,
    logAuditAction,
    selectedInstitutionId,
    setSelectedInstitutionId,
  } = useApp();

  // Page Mode: 'simulator' (Interactive Institutional Changes) vs 'macro-forecast' (Temporal Regulatory Drift)
  const [pageMode, setPageMode] = useState<'simulator' | 'macro-forecast'>('simulator');

  // Macro-forecast existing state
  const [activeSimulationRunning, setActiveSimulationRunning] = useState(false);
  const [selectedHorizon, setSelectedHorizon] = useState<TimeMachineScenario['horizon']>('30_DAYS');
  const currentMacroScenario =
    timeMachineScenarios.find((s) => s.horizon === selectedHorizon) ||
    timeMachineScenarios[0];

  // ----------------- Simulator State -----------------
  const [ruleVersions, setRuleVersions] = useState<RuleVersionOption[]>([]);
  const [selectedRuleVersion, setSelectedRuleVersion] = useState<string>('v2025_26');
  const [activeFilterTab, setActiveFilterTab] = useState<
    'ALL' | 'PASS_TO_FAIL' | 'FAIL_TO_PASS' | 'FAIL_TO_FAIL' | 'PASS_TO_PASS' | 'UNRESOLVED_ASSUMPTION'
  >('ALL');

  // Selected Baseline Institution
  const defaultInstitution = institutions[0] || {
    id: 'INST-01',
    pid: '1-4359812451',
    name: 'Apex Horizon Institute of Technology & Management',
    category: 'Engineering & Technology',
    approvedIntakeTotal: 240,
    admittedStrengthTotal: 920,
    totalFacultyCount: 52,
    totalLandAcres: 4.5,
    totalBuiltUpAreaSqM: 4200,
  };

  const [selectedPid, setSelectedPid] = useState<string>(
    selectedInstitutionId
      ? institutions.find((i) => i.id === selectedInstitutionId)?.pid || defaultInstitution.pid
      : defaultInstitution.pid
  );

  const currentInstitution = useMemo(() => {
    return institutions.find((i) => i.pid === selectedPid) || defaultInstitution;
  }, [institutions, selectedPid, defaultInstitution]);

  // Baseline Profile generated from selected institution
  const initialBaseline: SimInstitutionProfile = useMemo(() => {
    const intake = currentInstitution.approvedIntakeTotal || 240;
    const faculty = currentInstitution.totalFacultyCount || 52;
    const profs = Math.max(1, Math.floor(faculty / 9));
    const assoc = Math.max(2, Math.floor((faculty * 2) / 9));
    const asst = Math.max(1, faculty - profs - assoc);

    return {
      pid: currentInstitution.pid,
      name: currentInstitution.name,
      category: currentInstitution.category || 'Engineering & Technology',
      approved_intake_total: intake,
      admitted_strength_total: currentInstitution.admittedStrengthTotal || intake * 3.8,
      total_faculty_count: faculty,
      professors_count: profs,
      associate_professors_count: assoc,
      assistant_professors_count: asst,
      phd_faculty_count: profs + assoc,
      total_land_acres: currentInstitution.totalLandAcres || 4.5,
      total_builtup_area_sqm: currentInstitution.totalBuiltUpAreaSqM || 4200,
      classrooms_count: Math.max(4, Math.round((intake * 4) / 45)),
      laboratories_count: 14,
      computer_terminals: Math.round(intake * 4 * 0.25),
      library_volumes: 18500,
      annual_budget_lakhs: 280.0,
      courses: [
        { id: 'C1', name: 'Computer Science & Engineering', intake: Math.round(intake * 0.5), level: 'UG', is_nba_accredited: true },
        { id: 'C2', name: 'Mechanical Engineering', intake: Math.round(intake * 0.25), level: 'UG', is_nba_accredited: true },
        { id: 'C3', name: 'Electronics & Communication', intake: Math.round(intake * 0.25), level: 'UG', is_nba_accredited: false },
      ],
      has_architect_certificate: true,
      has_land_mutation_clearance: true,
      has_fire_safety_noc: true,
      has_university_affiliation: true,
      nba_accredited_programs_count: 2,
    };
  }, [currentInstitution]);

  // Proposed scenario configuration (editable)
  const [proposed, setProposed] = useState<SimInstitutionProfile>(initialBaseline);
  const [scenarioName, setScenarioName] = useState<string>('Expansion Simulation');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationReport, setSimulationReport] = useState<SimReport | null>(null);

  // Modals
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [savedScenariosList, setSavedScenariosList] = useState<SimReport[]>([]);

  // Load Rulebooks on mount
  useEffect(() => {
    fetchSimulatorRulesets().then(setRuleVersions);
  }, []);

  // When selected institution changes, reset proposed
  useEffect(() => {
    setProposed(initialBaseline);
    setScenarioName(`${currentInstitution.name.split(' ')[0]} Proposed Expansion`);
  }, [initialBaseline, currentInstitution]);

  // Execute simulation whenever baseline, proposed, or rule version changes
  useEffect(() => {
    let isCancelled = false;
    const run = async () => {
      setIsSimulating(true);
      try {
        const report = await evaluateSimulation(
          initialBaseline,
          proposed,
          selectedRuleVersion,
          scenarioName
        );
        if (!isCancelled) {
          setSimulationReport(report);
        }
      } catch (err) {
        console.error('Simulation execution error:', err);
      } finally {
        if (!isCancelled) setIsSimulating(false);
      }
    };
    run();
    return () => {
      isCancelled = true;
    };
  }, [initialBaseline, proposed, selectedRuleVersion, scenarioName]);

  // Presets Handlers
  const handleApplyPreset = (type: string) => {
    const clone = { ...proposed };
    if (type === 'INTAKE_EXPANSION_120') {
      clone.approved_intake_total = initialBaseline.approved_intake_total + 120;
      setScenarioName(`Intake Expansion (+120 seats)`);
      addToast('info', 'Simulated +120 seats intake expansion. Review SFR and classroom deficits.', 'Preset Applied');
    } else if (type === 'ADD_AI_COURSE') {
      const newCourse = {
        id: `C-${Date.now().toString().slice(-4)}`,
        name: 'Artificial Intelligence & Data Science',
        intake: 60,
        level: 'UG',
        is_nba_accredited: false,
      };
      clone.courses = [...clone.courses, newCourse];
      clone.approved_intake_total = clone.approved_intake_total + 60;
      setScenarioName(`Add AI/DS Department (+60 seats)`);
      addToast('info', 'Added B.Tech AI & Data Science (60 seats). Computing terminals and lab norms updated.', 'Preset Applied');
    } else if (type === 'SENIOR_FACULTY_ATTRITION') {
      clone.professors_count = Math.max(0, clone.professors_count - 2);
      clone.total_faculty_count = Math.max(1, clone.total_faculty_count - 2);
      clone.phd_faculty_count = Math.max(0, clone.phd_faculty_count - 2);
      setScenarioName(`Senior Cadre Attrition (-2 Professors)`);
      addToast('warning', 'Simulated loss of 2 senior Professors. Check Cadre Ratio violations.', 'Preset Applied');
    } else if (type === 'INFRASTRUCTURE_EXPANSION') {
      clone.total_builtup_area_sqm += 1500;
      clone.classrooms_count += 4;
      clone.laboratories_count += 2;
      clone.computer_terminals += 60;
      setScenarioName(`Infrastructure Upgradation (+1500 sq.m)`);
      addToast('success', 'Expanded built-up area and smart classrooms.', 'Preset Applied');
    } else if (type === 'REMEDIATION_PACKAGE') {
      // Rebalances faculty to satisfy 1:20 SFR and 1:2:6 cadre
      const reqFaculty = Math.round((clone.approved_intake_total * 4) / 20);
      const profs = Math.max(1, Math.floor(reqFaculty / 9));
      const assoc = Math.max(2, Math.floor((reqFaculty * 2) / 9));
      const asst = Math.max(1, reqFaculty - profs - assoc);
      clone.total_faculty_count = reqFaculty;
      clone.professors_count = profs;
      clone.associate_professors_count = assoc;
      clone.assistant_professors_count = asst;
      clone.phd_faculty_count = profs + assoc;
      clone.total_builtup_area_sqm = clone.approved_intake_total * 4 * 4.2;
      clone.classrooms_count = Math.max(4, Math.round((clone.approved_intake_total * 4) / 45));
      clone.computer_terminals = Math.round(clone.approved_intake_total * 4 * 0.25);
      clone.has_architect_certificate = true;
      clone.has_land_mutation_clearance = true;
      setScenarioName(`Comprehensive Remediation Package`);
      addToast('success', 'All instructional space and faculty ratios rebalanced for compliance.', 'Remediation Configured');
    } else if (type === 'RESET') {
      setProposed(initialBaseline);
      setScenarioName(`${currentInstitution.name.split(' ')[0]} Proposed Expansion`);
      addToast('info', 'Simulation reset to baseline institution values.', 'Reset Complete');
      return;
    }
    setProposed(clone);
  };

  const handleSaveScenario = async () => {
    if (!simulationReport) return;
    const toSave: SimReport = {
      ...simulationReport,
      scenario_name: saveTitle.trim() || scenarioName,
    };
    try {
      await saveSimulationScenario(toSave);
      addToast('success', `Scenario '${toSave.scenario_name}' saved to repository.`, 'Scenario Persisted');
      logAuditAction(`Compliance Time Machine Scenario Saved: ${toSave.scenario_name}`, toSave.baseline_name, 'STATUS_CHANGE', 'Info');
      setSaveModalOpen(false);
      setSaveTitle('');
    } catch {
      addToast('error', 'Failed to save scenario report.', 'Save Error');
    }
  };

  const handleOpenReopenModal = async () => {
    const list = await fetchSavedScenarios();
    setSavedScenariosList(list);
    setReopenModalOpen(true);
  };

  const handleRestoreScenario = (saved: SimReport) => {
    const foundInst = institutions.find((i) => i.pid === saved.baseline_pid);
    if (foundInst) {
      setSelectedPid(foundInst.pid);
    }
    // Set proposed from metrics delta
    const d = saved.metric_deltas;
    const restoredProposed: SimInstitutionProfile = {
      ...initialBaseline,
      approved_intake_total: d.intake ? d.intake.proposed : initialBaseline.approved_intake_total,
      total_faculty_count: d.faculty ? d.faculty.proposed : initialBaseline.total_faculty_count,
      total_builtup_area_sqm: d.builtup_area ? d.builtup_area.proposed : initialBaseline.total_builtup_area_sqm,
      classrooms_count: d.classrooms ? d.classrooms.proposed : initialBaseline.classrooms_count,
    };
    setProposed(restoredProposed);
    setSelectedRuleVersion(saved.rule_version);
    setScenarioName(saved.scenario_name);
    setReopenModalOpen(false);
    addToast('success', `Scenario '${saved.scenario_name}' restored successfully.`, 'Scenario Restored');
  };

  const handleExportJSON = () => {
    if (!simulationReport) return;
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(simulationReport, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', jsonStr);
    dlAnchorElem.setAttribute('download', `VerifloAI_Scenario_${simulationReport.scenario_id}.json`);
    dlAnchorElem.click();
    addToast('success', 'Scenario simulation report exported as JSON.', 'Export Ready');
  };

  const handleExportCSV = () => {
    if (!simulationReport) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Rule ID,Clause,Title,Category,Severity,Transition,Baseline Value,Proposed Value,Benchmark Threshold,Explanation,Required Evidence,Affected Records\n' +
      simulationReport.checks
        .map(
          (c) =>
            `"${c.rule_id}","${c.clause}","${c.title}","${c.category}","${c.severity}","${c.transition_label}","${c.baseline_value}","${c.proposed_value}","${c.benchmark_threshold}","${c.explanation.replace(/"/g, '""')}","${c.required_evidence.replace(/"/g, '""')}","${c.affected_records.join('; ')}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VerifloAI_Scenario_Comparison_${simulationReport.scenario_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Scenario comparison matrix exported as CSV.', 'Export Complete');
  };

  // Filtered checks list
  const filteredChecks = useMemo(() => {
    if (!simulationReport) return [];
    if (activeFilterTab === 'ALL') return simulationReport.checks;
    return simulationReport.checks.filter((c) => c.transition === activeFilterTab);
  }, [simulationReport, activeFilterTab]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <Compass className="w-3.5 h-3.5" />
              <span>Compliance Time Machine</span>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold">
              Scenario Simulator v4.2
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              Zero-Mutation Sandbox
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Institutional Change Simulator & What-If Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Test proposed seat increases, course additions, faculty hiring, and infrastructure expansions against versioned AICTE rules before filing.
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center text-xs font-medium">
            <button
              onClick={() => setPageMode('simulator')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                pageMode === 'simulator'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Interactive Simulator
            </button>
            <button
              onClick={() => setPageMode('macro-forecast')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                pageMode === 'macro-forecast'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Macro Drift Forecast
            </button>
          </div>

          {pageMode === 'simulator' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSaveModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
                title="Save this simulation scenario"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                onClick={handleOpenReopenModal}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                title="Reopen previously saved scenario"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Reopen</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                title="Export Comparison Matrix as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                title="Export Full Scenario Report as JSON"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory GovTech Safeguard & Zero-Mutation Disclaimer Banner */}
      <div className="p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-800/80 bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-teal-50/30 dark:from-amber-950/40 dark:via-slate-900 dark:to-teal-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Statutory Sandbox Isolation Directive
            </span>
            <span className="px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-mono text-[10px]">
              Non-Mutating Simulation
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
            This interactive simulator executes against an in-memory isolated sandbox. <strong>Running simulations will never alter actual institutional records, modify statutory applications, or grant regulatory approvals.</strong>
            Rule results reflect configured illustrative demo formulas until official verified parameters are gazetted.
          </p>
        </div>
      </div>

      {pageMode === 'simulator' ? (
        /* ==================== INTERACTIVE INSTITUTIONAL SCENARIO SIMULATOR ==================== */
        <div className="space-y-6">
          {/* Top Deck: Baseline Selector, Rule Version, and Preset Scenarios */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Baseline Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  1. Select Baseline Institution
                </label>
                <select
                  value={selectedPid}
                  onChange={(e) => setSelectedPid(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {institutions.map((inst) => (
                    <option key={inst.pid} value={inst.pid}>
                      {inst.name} (PID: {inst.pid})
                    </option>
                  ))}
                </select>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Baseline Intake: {initialBaseline.approved_intake_total} seats</span>
                  <span>Faculty: {initialBaseline.total_faculty_count}</span>
                </div>
              </div>

              {/* 2. Rulebook Version Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  2. Versioned Compliance Rulebook
                </label>
                <select
                  value={selectedRuleVersion}
                  onChange={(e) => setSelectedRuleVersion(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="v2025_26">AICTE APH 2025-26 (v4.0 Current Benchmark)</option>
                  <option value="v2026_27">AICTE APH 2026-27 (v4.2 Draft - Stricter 1:15 SFR)</option>
                  <option value="v2024_25">AICTE APH 2024-25 (v3.2 Baseline Norms)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  {selectedRuleVersion === 'v2026_27'
                    ? 'Stricter 1:15 SFR, +60 seat expansion limit, 4.5 sq.m/student.'
                    : selectedRuleVersion === 'v2024_25'
                    ? 'Historical baseline norms: 1:20 SFR, 4.0 sq.m/student.'
                    : 'Current active standard: 1:20 SFR, 4.0 sq.m/student, 0.25 computers/student.'}
                </p>
              </div>

              {/* 3. Scenario Name & Reset */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    3. Scenario Title
                  </label>
                  <button
                    onClick={() => handleApplyPreset('RESET')}
                    className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to Baseline
                  </button>
                </div>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. 2026 Expansion Scenario"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Custom label for export reports and audit logs.
                </p>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Simulate Institutional Transformation Scenarios (1-Click Presets):
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => handleApplyPreset('INTAKE_EXPANSION_120')}
                  className="px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 hover:bg-teal-100 font-medium transition-colors flex items-center gap-1"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                  <span>+120 Intake Expansion (240 → 360)</span>
                </button>
                <button
                  onClick={() => handleApplyPreset('ADD_AI_COURSE')}
                  className="px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 hover:bg-blue-100 font-medium transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Add B.Tech AI & Data Science (60 seats)</span>
                </button>
                <button
                  onClick={() => handleApplyPreset('SENIOR_FACULTY_ATTRITION')}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 hover:bg-rose-100 font-medium transition-colors flex items-center gap-1"
                >
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>Senior Faculty Shock (-2 Professors)</span>
                </button>
                <button
                  onClick={() => handleApplyPreset('INFRASTRUCTURE_EXPANSION')}
                  className="px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 font-medium transition-colors flex items-center gap-1"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Infrastructure Expansion (+1500 sq.m)</span>
                </button>
                <button
                  onClick={() => handleApplyPreset('REMEDIATION_PACKAGE')}
                  className="px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-200 hover:bg-purple-100 font-medium transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Remediate All Deficits (Balanced Cadre)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Parameters Configuration & Proposed Values Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 5 Cols: Editable Parameters Form */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Configure Proposed Values
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Real-time Simulation
                </span>
              </div>

              {/* Sliders & Numeric Controls */}
              <div className="space-y-3.5 text-xs">
                {/* 1. Approved Intake */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Approved Annual Intake (Seats)
                    </span>
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-sm">
                      {proposed.approved_intake_total}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        (Baseline: {initialBaseline.approved_intake_total})
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="120"
                    max="600"
                    step="30"
                    value={proposed.approved_intake_total}
                    onChange={(e) =>
                      setProposed({
                        ...proposed,
                        approved_intake_total: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>120</span>
                    <span>240 (Baseline)</span>
                    <span>360</span>
                    <span>480</span>
                    <span>600</span>
                  </div>
                </div>

                {/* 2. Faculty Strength & Senior Cadre Breakdown */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                      Faculty Strength & Cadres
                    </span>
                    <span className="font-mono text-teal-600 font-bold">
                      Total: {proposed.total_faculty_count}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="text-slate-500 block mb-0.5">Professors</label>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        value={proposed.professors_count}
                        onChange={(e) => {
                          const profs = parseInt(e.target.value, 10) || 0;
                          setProposed({
                            ...proposed,
                            professors_count: profs,
                            total_faculty_count: profs + proposed.associate_professors_count + proposed.assistant_professors_count,
                          });
                        }}
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-0.5">Associate Profs</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={proposed.associate_professors_count}
                        onChange={(e) => {
                          const assoc = parseInt(e.target.value, 10) || 0;
                          setProposed({
                            ...proposed,
                            associate_professors_count: assoc,
                            total_faculty_count: proposed.professors_count + assoc + proposed.assistant_professors_count,
                          });
                        }}
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-0.5">Assistant Profs</label>
                      <input
                        type="number"
                        min="0"
                        max="80"
                        value={proposed.assistant_professors_count}
                        onChange={(e) => {
                          const asst = parseInt(e.target.value, 10) || 0;
                          setProposed({
                            ...proposed,
                            assistant_professors_count: asst,
                            total_faculty_count: proposed.professors_count + proposed.associate_professors_count + asst,
                          });
                        }}
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-0.5">Ph.D. Holders</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={proposed.phd_faculty_count}
                        onChange={(e) =>
                          setProposed({
                            ...proposed,
                            phd_faculty_count: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Physical Infrastructure */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      Physical Infrastructure Space
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="text-slate-500 block mb-0.5">Built-up Area (sq.m)</label>
                      <input
                        type="number"
                        step="100"
                        value={proposed.total_builtup_area_sqm}
                        onChange={(e) =>
                          setProposed({
                            ...proposed,
                            total_builtup_area_sqm: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-0.5">Land Area (Acres)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={proposed.total_land_acres}
                        onChange={(e) =>
                          setProposed({
                            ...proposed,
                            total_land_acres: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-0.5">Classrooms Count</label>
                      <input
                        type="number"
                        value={proposed.classrooms_count}
                        onChange={(e) =>
                          setProposed({
                            ...proposed,
                            classrooms_count: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-0.5">Computer Terminals</label>
                      <input
                        type="number"
                        step="10"
                        value={proposed.computer_terminals}
                        onChange={(e) =>
                          setProposed({
                            ...proposed,
                            computer_terminals: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Evidence & Assumptions Checklist */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-between">
                    <span>Evidence Readiness Assumptions</span>
                    <span className="text-[10px] text-slate-400 font-normal">Check if verified</span>
                  </span>

                  <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={proposed.has_architect_certificate}
                        onChange={(e) =>
                          setProposed({ ...proposed, has_architect_certificate: e.target.checked })
                        }
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>Chartered Architect Built-up Certificate attached</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={proposed.has_land_mutation_clearance}
                        onChange={(e) =>
                          setProposed({ ...proposed, has_land_mutation_clearance: e.target.checked })
                        }
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>State Land Mutation & Revenue conversion endorsed</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={proposed.has_fire_safety_noc}
                        onChange={(e) =>
                          setProposed({ ...proposed, has_fire_safety_noc: e.target.checked })
                        }
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>Fire & Life Safety NOC renewed through academic cycle</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Before vs After Metrics & Feasibility Verdict */}
            <div className="lg:col-span-7 space-y-4">
              {/* Feasibility Verdict Card */}
              {simulationReport && (
                <div
                  className={`p-4 rounded-2xl border text-xs shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    simulationReport.overall_feasibility === 'Feasible'
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                      : simulationReport.overall_feasibility === 'Remediation Required'
                      ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'
                      : 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          simulationReport.overall_feasibility === 'Feasible'
                            ? 'success'
                            : simulationReport.overall_feasibility === 'Remediation Required'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {simulationReport.overall_feasibility.toUpperCase()}
                      </Badge>
                      <span className="font-bold text-sm">
                        Simulation Verdict: {simulationReport.scenario_name}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                      {simulationReport.summary_verdict}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">
                        New Deficits
                      </span>
                      <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                        {simulationReport.transition_counts.PASS_TO_FAIL}
                      </span>
                    </div>
                    <div className="h-8 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">
                        Remediated
                      </span>
                      <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {simulationReport.transition_counts.FAIL_TO_PASS}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Side-by-Side Visual Comparison Cards with Delta Badges */}
              {simulationReport && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Approved Intake
                    </span>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500">{simulationReport.metric_deltas.intake.baseline}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {simulationReport.metric_deltas.intake.proposed}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono inline-block ${
                        simulationReport.metric_deltas.intake.delta > 0
                          ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {simulationReport.metric_deltas.intake.delta >= 0 ? '+' : ''}
                      {simulationReport.metric_deltas.intake.delta} seats
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Faculty Roster
                    </span>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500">{simulationReport.metric_deltas.faculty.baseline}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {simulationReport.metric_deltas.faculty.proposed}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono inline-block ${
                        simulationReport.metric_deltas.faculty.delta < 0
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                          : simulationReport.metric_deltas.faculty.delta > 0
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {simulationReport.metric_deltas.faculty.delta >= 0 ? '+' : ''}
                      {simulationReport.metric_deltas.faculty.delta} faculty
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Built-up Space
                    </span>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-slate-500">{simulationReport.metric_deltas.builtup_area.baseline.toLocaleString()}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {simulationReport.metric_deltas.builtup_area.proposed.toLocaleString()}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono inline-block ${
                        simulationReport.metric_deltas.builtup_area.delta > 0
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {simulationReport.metric_deltas.builtup_area.delta >= 0 ? '+' : ''}
                      {simulationReport.metric_deltas.builtup_area.delta.toLocaleString()} sq.m
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Classrooms
                    </span>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500">{simulationReport.metric_deltas.classrooms.baseline}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {simulationReport.metric_deltas.classrooms.proposed}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono inline-block ${
                        simulationReport.metric_deltas.classrooms.delta > 0
                          ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {simulationReport.metric_deltas.classrooms.delta >= 0 ? '+' : ''}
                      {simulationReport.metric_deltas.classrooms.delta} rooms
                    </span>
                  </div>
                </div>
              )}

              {/* Dependency Impact Cascade Tree */}
              {simulationReport && simulationReport.dependency_cascade.length > 0 && (
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Network className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Institutional Dependency Impact Cascade ({simulationReport.dependency_cascade.length})
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Downstream Ripple Effects
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {simulationReport.dependency_cascade.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-700 dark:text-teal-300 text-[11px]">
                            {item.impacted_domain}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Trigger: {item.delta}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                          {item.requirement_summary}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          <strong>Action:</strong> {item.recommended_procurement}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compliance Checks Transition Matrix */}
          {simulationReport && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Versioned Compliance Rules Transition Matrix
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluated against {simulationReport.rule_version_name}. Shows checks that change from Pass to Fail, Fail to Pass, or remain unresolved.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <button
                    onClick={() => setActiveFilterTab('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      activeFilterTab === 'ALL'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    All Checks ({simulationReport.checks.length})
                  </button>
                  <button
                    onClick={() => setActiveFilterTab('PASS_TO_FAIL')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      activeFilterTab === 'PASS_TO_FAIL'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                    }`}
                  >
                    New Deficits ({simulationReport.transition_counts.PASS_TO_FAIL})
                  </button>
                  <button
                    onClick={() => setActiveFilterTab('FAIL_TO_PASS')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      activeFilterTab === 'FAIL_TO_PASS'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    }`}
                  >
                    Remediated ({simulationReport.transition_counts.FAIL_TO_PASS})
                  </button>
                  <button
                    onClick={() => setActiveFilterTab('FAIL_TO_FAIL')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      activeFilterTab === 'FAIL_TO_FAIL'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                    }`}
                  >
                    Unresolved ({simulationReport.transition_counts.FAIL_TO_FAIL})
                  </button>
                  <button
                    onClick={() => setActiveFilterTab('PASS_TO_PASS')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      activeFilterTab === 'PASS_TO_PASS'
                        ? 'bg-teal-600 text-white'
                        : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900'
                    }`}
                  >
                    Compliant ({simulationReport.transition_counts.PASS_TO_PASS})
                  </button>
                  <button
                    onClick={() => setActiveFilterTab('UNRESOLVED_ASSUMPTION')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      activeFilterTab === 'UNRESOLVED_ASSUMPTION'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
                    }`}
                  >
                    Assumptions ({simulationReport.transition_counts.UNRESOLVED_ASSUMPTION})
                  </button>
                </div>
              </div>

              {/* Checks Cards Grid */}
              <div className="space-y-3">
                {filteredChecks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                    No compliance checks match the active filter tab.
                  </div>
                ) : (
                  filteredChecks.map((check) => {
                    const isNewDeficit = check.transition === 'PASS_TO_FAIL';
                    const isRemediated = check.transition === 'FAIL_TO_PASS';
                    const isUnresolved = check.transition === 'FAIL_TO_FAIL';
                    const isAssumption = check.transition === 'UNRESOLVED_ASSUMPTION';

                    return (
                      <div
                        key={check.rule_id}
                        className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                          isNewDeficit
                            ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/40 dark:bg-rose-950/20'
                            : isRemediated
                            ? 'border-emerald-300 dark:border-emerald-900/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                            : isUnresolved
                            ? 'border-amber-300 dark:border-amber-900/80 bg-amber-50/40 dark:bg-amber-950/20'
                            : isAssumption
                            ? 'border-purple-300 dark:border-purple-900/80 bg-purple-50/40 dark:bg-purple-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                        }`}
                      >
                        {/* Check Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
                                {check.rule_id}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {check.title}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({check.clause})
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-sans">
                                {check.rule_label}
                              </span>
                            </div>
                          </div>

                          {/* Transition Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono shrink-0 ${
                              isNewDeficit
                                ? 'bg-rose-600 text-white shadow-xs'
                                : isRemediated
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : isUnresolved
                                ? 'bg-amber-600 text-white shadow-xs'
                                : isAssumption
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {check.transition_label}
                          </span>
                        </div>

                        {/* Values Comparison Strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-400 block font-sans text-[10px] uppercase font-semibold">
                              Baseline Value:
                            </span>
                            <span className={check.baseline_passed ? 'text-slate-700 dark:text-slate-300' : 'text-amber-600 font-bold'}>
                              {check.baseline_value}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-sans text-[10px] uppercase font-semibold">
                              Proposed Simulation Value:
                            </span>
                            <span className={check.proposed_passed ? 'text-emerald-600 font-bold' : isAssumption ? 'text-purple-600 font-bold' : 'text-rose-600 font-bold'}>
                              {check.proposed_value}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-sans text-[10px] uppercase font-semibold">
                              Benchmark Regulatory Threshold:
                            </span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {check.benchmark_threshold}
                            </span>
                          </div>
                        </div>

                        {/* Rule Explanation */}
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                          <strong>Rule Impact Analysis: </strong> {check.explanation}
                        </p>

                        {/* Required Evidence & Affected Records Footer */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <strong className="text-slate-700 dark:text-slate-300">Required Evidence: </strong>
                            {check.required_evidence}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-slate-400 shrink-0">
                            <strong>Affected: </strong>
                            {check.affected_records.join(', ')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ==================== MACRO REGULATORY DRIFT FORECAST ==================== */
        <div className="space-y-6">
          {/* Time Horizon Scrubber */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Select Prediction Time Horizon
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                Temporal Forecast Model: DriftNet v2.1
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {timeMachineScenarios.map((scenario) => {
                const isSelected = selectedHorizon === scenario.horizon;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedHorizon(scenario.horizon)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 ring-1 ring-teal-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {scenario.horizonLabel}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-600 text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-medium text-teal-700 dark:text-teal-400 truncate">
                      {scenario.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {scenario.impactSummary.atRiskInstitutionsCount} institutions at risk
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scenario Overview Banner */}
          <div className="bg-gradient-to-r from-[#071626] to-[#102A43] p-5 sm:p-6 rounded-2xl text-white border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-teal-300 font-semibold bg-teal-950 border border-teal-800 px-2 py-0.5 rounded">
                    Horizon: {currentMacroScenario.horizonLabel}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    Simulation Model: Predictive Drift
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {currentMacroScenario.name}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {currentMacroScenario.description}
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveSimulationRunning(true);
                  addToast('info', `Simulating regulatory drift model for ${currentMacroScenario.horizonLabel}...`, 'Predictive Engine');
                  setTimeout(() => {
                    setActiveSimulationRunning(false);
                    addToast('success', 'Macro temporal simulation complete.', 'Forecast Ready');
                  }, 1000);
                }}
                disabled={activeSimulationRunning}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-md shadow-teal-950/40 disabled:opacity-50"
              >
                <FastForward className="w-4 h-4" />
                <span>{activeSimulationRunning ? 'Simulating...' : 'Fast-Forward Drift'}</span>
              </button>
            </div>

            {/* Simulated Trigger Vectors */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Simulated Regulatory Triggers in this Horizon:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {currentMacroScenario.simulatedChanges.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">{change}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Macro Impact Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                At-Risk Institutions
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {currentMacroScenario.impactSummary.atRiskInstitutionsCount} Colleges
                <span className="text-xs font-semibold text-rose-500 flex items-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +2 vs now
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Projected to fall below APH minimum standards</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Projected Critical Deficits
              </span>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                {currentMacroScenario.impactSummary.projectedCriticalFlags} Flags
              </div>
              <p className="text-[11px] text-slate-500">Imminent mandatory show-cause violations</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Non-Compliance Failure Rate
              </span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                {currentMacroScenario.impactSummary.projectedNonComplianceRate}%
              </div>
              <p className="text-[11px] text-slate-500">Predicted failure probability in scrutiny</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Highest Risk Category
              </span>
              <div className="text-base font-bold text-teal-600 dark:text-teal-400 truncate">
                {currentMacroScenario.impactSummary.highestRiskCategory}
              </div>
              <p className="text-[11px] text-slate-500">Primary driver of predicted non-compliance</p>
            </div>
          </div>

          {/* Macro Institution Projections Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Projected Institutional Vulnerability Roster
            </h3>
            <div className="space-y-3">
              {currentMacroScenario.institutionProjections.map((proj) => (
                <div
                  key={proj.institutionId}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {proj.institutionName} (PID: {proj.pid})
                    </span>
                    <Badge variant={proj.riskTrend === 'Severe' ? 'danger' : 'warning'} size="xs">
                      {proj.riskTrend} Drift Risk
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    <strong>Cause: </strong> {proj.imminentDeficiency}
                  </p>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400">
                    <strong>Preventative Action: </strong> {proj.recommendedPreventativeAction}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Scenario Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Save className="w-4 h-4 text-teal-600" />
                Save Simulation Scenario
              </h3>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Save this scenario configuration and its compliance transitions to the local regulatory repository for future reference or comparative audits.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Scenario Title
              </label>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder={scenarioName}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScenario}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
              >
                Save Scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Saved Scenarios Modal */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-teal-600" />
                Reopen Saved Simulation Scenarios ({savedScenariosList.length})
              </h3>
              <button
                onClick={() => setReopenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
              {savedScenariosList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  No saved scenarios found in local repository.
                </div>
              ) : (
                savedScenariosList.map((s) => (
                  <div
                    key={s.scenario_id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 bg-white dark:bg-slate-850 flex items-center justify-between gap-3 text-xs transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {s.scenario_name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {s.scenario_id}
                        </span>
                        <Badge
                          variant={
                            s.overall_feasibility === 'Feasible'
                              ? 'success'
                              : s.overall_feasibility === 'Remediation Required'
                              ? 'warning'
                              : 'danger'
                          }
                          size="xs"
                        >
                          {s.overall_feasibility}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {s.baseline_name} • Rulebook: {s.rule_version_name} • Saved: {s.created_at}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRestoreScenario(s)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shrink-0"
                    >
                      Restore Parameters
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
