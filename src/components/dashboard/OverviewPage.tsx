import React from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  Eye,
  EyeOff,
  FastForward,
  FileCheck2,
  FileSearch,
  FileText,
  Filter,
  Flame,
  GitFork,
  History,
  Layers,
  Network,
  Play,
  PlusCircle,
  Radio,
  RefreshCw,
  Scale,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { Badge, RiskBadge, StatusBadge } from '../common/Badge';
import { StatCard } from '../common/StatCard';

const MONTHLY_TREND_DATA = [
  { month: 'Oct 24', submitted: 180, cleared: 140, deficient: 32 },
  { month: 'Nov 24', submitted: 320, cleared: 260, deficient: 54 },
  { month: 'Dec 24', submitted: 480, cleared: 390, deficient: 78 },
  { month: 'Jan 25', submitted: 620, cleared: 510, deficient: 98 },
  { month: 'Feb 25 (Proj)', submitted: 840, cleared: 690, deficient: 120 },
];

const DEFICIENCY_CATEGORY_DATA = [
  { name: 'Faculty Cadre & FSR', count: 48, fill: '#3B82F6' },
  { name: 'Fire & Life Safety NOC', count: 34, fill: '#F59E0B' },
  { name: 'Built-up Area / Land', count: 28, fill: '#0D9488' },
  { name: 'AI Tamper / Anomaly', count: 18, fill: '#EF4444' },
  { name: 'Divyangjan / Ramps', count: 22, fill: '#8B5CF6' },
];

const REGIONAL_DISTRIBUTION_DATA = [
  { region: 'Western (WRO)', total: 412, cleared: 310, flags: 24 },
  { region: 'Northern (NRO)', total: 328, cleared: 215, flags: 38 },
  { region: 'South-Western (SWRO)', total: 295, cleared: 240, flags: 14 },
  { region: 'Southern (SRO)', total: 240, cleared: 195, flags: 16 },
  { region: 'Eastern (ERO)', total: 153, cleared: 104, flags: 20 },
];

export const OverviewPage: React.FC = () => {
  const {
    stats,
    applications,
    documents,
    institutions,
    auditLogs,
    reviewQueue,
    sourceRegistries,
    blindSpots,
    pingSourceRegistry,
    setActiveTab,
    setSelectedApplicationId,
    setNewAppModalOpen,
    addToast,
    logAuditAction,
  } = useApp();

  // Calculate live dynamic counts from actual active applications dataset
  const totalAppsCount = applications.length;
  const pendingScrutinyCount = applications.filter(
    (a) => a.status === 'Under AI Scrutiny' || a.status === 'Level 2: Scrutiny Committee'
  ).length;
  const flaggedDiscrepanciesCount = applications.filter(
    (a) =>
      a.deficienciesCount > 0 ||
      a.overallRiskLevel === 'High' ||
      a.overallRiskLevel === 'Severe'
  ).length;
  const approvedAppsCount = applications.filter(
    (a) => a.status === 'Approved / EoA Issued'
  ).length;

  const totalDeficiencyClauses = applications.reduce(
    (sum, a) => sum + a.deficienciesCount,
    0
  );

  const flaggedApplications = applications.filter(
    (a) => a.overallRiskLevel === 'High' || a.overallRiskLevel === 'Severe' || a.deficienciesCount > 0
  );

  const handleRunBatchScan = () => {
    addToast('info', 'Veriflo AI neural scrutiny batch scan initiated across active institutional dossiers.', 'Batch Processing');
    logAuditAction('Batch AI OCR & Forensic Verification Executed', 'Active Applications Pool', 'AI_SCAN', 'Info');
    setTimeout(() => {
      addToast('success', 'Batch scan completed: 8 dossiers analyzed, 2 critical anomalies reaffirmed.', 'Batch Complete');
    }, 1200);
  };

  const handleExportSummary = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Application No,Institution,Region,Status,Risk Level,Deficiencies\n" +
      applications
        .map(
          (a) =>
            `"${a.applicationNumber}","${a.institutionName}","${a.region}","${a.status}","${a.overallRiskLevel}",${a.deficienciesCount}`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VerifloAI_Summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Regulatory summary report exported as CSV.', 'Export Complete');
  };

  return (
    <div className="space-y-6">
      {/* GovTech Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#071626] via-[#102A43] to-[#0A192F] p-6 sm:p-8 text-white border border-slate-800 shadow-lg">
        {/* Decorative Grid and Accent Glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Veriflo AI • Approval Process Handbook (APH 2025-26) Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AI-Powered Application Validation & Regulatory Verification
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Automated multi-tier scrutiny engine for technical institutions: validating faculty cadre ratios, built-up areas, municipal fire clearances, cadastral mutations, and digital tamper forensics.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setNewAppModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold shadow-md shadow-teal-950/50 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Application</span>
            </button>
            <button
              onClick={handleRunBatchScan}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-teal-400" />
              <span>Run AI Batch Check</span>
            </button>
            <button
              onClick={handleExportSummary}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
              title="Export Summary CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrutiny Cycle Sub-bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Active Scrutiny Cycle</span>
            <span className="font-bold text-white text-sm">{stats.currentCycle}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Cycle Stage</span>
            <span className="font-bold text-teal-400 text-sm">{stats.cyclePhase}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Regulatory Cutoff</span>
            <span className="font-bold text-amber-300 text-sm flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {stats.cycleDeadline} ({stats.daysRemaining} days left)
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Mean Verification Latency</span>
            <span className="font-bold text-emerald-400 text-sm flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {stats.averageReviewTimeDays} Days / Dossier
            </span>
          </div>
        </div>
      </div>

      {/* THREE PROMINENT FEATURE CARDS (Predict, Trace, Expose Gaps) */}
      {/* FOUR PROMINENT FEATURE CARDS (Predict, Trace, Expose Gaps, Visual Inspect) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Predict (Compliance Time Machine) */}
        <div
          onClick={() => setActiveTab('compliance-time-machine')}
          className="group relative bg-gradient-to-br from-teal-950/40 via-white to-white dark:via-slate-900 dark:to-slate-900 border-2 border-teal-500/30 hover:border-teal-500 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-teal-500/10 dark:bg-teal-950 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                <Compass className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                01 • Predict
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                Compliance Time Machine
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Simulate temporal regulatory drift, document validity expirations, and upcoming APH policy revisions.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-teal-600 dark:text-teal-400">
            <span>Launch Simulation</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Trace (Evidence Dependency Graph) */}
        <div
          onClick={() => setActiveTab('evidence-dependency-graph')}
          className="group relative bg-gradient-to-br from-blue-950/40 via-white to-white dark:via-slate-900 dark:to-slate-900 border-2 border-blue-500/30 hover:border-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                02 • Trace
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Evidence Dependency Graph
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Trace end-to-end evidence lineage connecting certificates, CFO approvals, and land records.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span>Trace Lineage</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Expose Gaps (Verification Blind-Spot Detector) */}
        <div
          onClick={() => setActiveTab('blind-spot-detector')}
          className="group relative bg-gradient-to-br from-amber-950/40 via-white to-white dark:via-slate-900 dark:to-slate-900 border-2 border-amber-500/30 hover:border-amber-500 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <EyeOff className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                03 • Expose Gaps
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Blind-Spot Detector
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Expose hidden vulnerabilities that standard review misses: ghost faculty and missing API handshakes.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span>Scan Blind Spots</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Inspect (Infrastructure Evidence Review) */}
        <div
          onClick={() => setActiveTab('infrastructure-review')}
          className="group relative bg-gradient-to-br from-indigo-950/40 via-white to-white dark:via-slate-900 dark:to-slate-900 border-2 border-indigo-500/30 hover:border-indigo-500 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-indigo-500/10 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                04 • Inspect
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Infrastructure Review
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Audit claimed facilities vs blueprints & photos. Detect duplicate hashes and place visual scrutiny pins.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>Audit Visual Evidence</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (Calculated directly from real application data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Applications"
          value={totalAppsCount}
          subtitle="Registered institutional dossiers"
          icon={FileText}
          trend={{ value: `${approvedAppsCount} Cleared`, positive: true, label: 'completed EoA' }}
          accentColor="navy"
          onClick={() => setActiveTab('applications')}
        />
        <StatCard
          title="Pending Scrutiny"
          value={pendingScrutinyCount}
          subtitle="Under AI OCR & Level 2 Committee"
          icon={Bot}
          trend={{ value: `${reviewQueue.length} in Queue`, positive: false, label: 'officer worklist' }}
          accentColor="teal"
          onClick={() => setActiveTab('review-queue')}
        />
        <StatCard
          title="Flagged Discrepancies"
          value={flaggedDiscrepanciesCount}
          subtitle={`${totalDeficiencyClauses} total deficiency clauses`}
          icon={AlertTriangle}
          trend={{ value: `${blindSpots.length} Blind Spots`, positive: false, label: 'detected' }}
          accentColor="amber"
          onClick={() => setActiveTab('review-queue')}
        />
        <StatCard
          title="AI Automated Pass Rate"
          value={`${stats.automatedPassRatePercent}%`}
          subtitle="Clean regulatory validation score"
          icon={FileCheck2}
          trend={{ value: '+4.2%', positive: true, label: 'vs last cycle' }}
          accentColor="emerald"
        />
      </div>

      {/* Source Verification Statuses Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Government Source Registry Verification Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live automated validation handshakes against state land, fire safety, DigiLocker, and EPFO databases
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 font-semibold">
            6 Handshake Gateways Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sourceRegistries.map((source) => {
            const isSync = source.status === 'Synchronized';
            const isOnline = source.status === 'Online';

            return (
              <div
                key={source.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                      {source.sourceName}
                    </h4>
                    <p className="text-[10px] text-slate-400">{source.authority}</p>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      isSync
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : isOnline
                        ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {source.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                  <span>Verified: <strong>{source.verifiedCount}</strong></span>
                  <span>Flags: <strong className="text-rose-600">{source.flaggedCount}</strong></span>
                  <span className="font-mono text-[10px] text-slate-400">{source.latencyMs}ms</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
                  <span>Ping: {source.lastPing}</span>
                  <button
                    onClick={() => pingSourceRegistry(source.id)}
                    className="text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Ping Handshake</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Compliance & Approval Trends (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Scrutiny Progression & Clearance Trends
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly volume of dossiers submitted vs cleared by AI & Regional Officers
              </p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-medium">
              Live Feed
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCleared" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="submitted"
                  name="Applications Submitted"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSubmitted)"
                />
                <Area
                  type="monotone"
                  dataKey="cleared"
                  name="EoA Issued / Cleared"
                  stroke="#0D9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCleared)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Deficiencies Breakdown by Category (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Deficiency Category Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primary non-compliance clauses in current cycle
              </p>
            </div>
            <button
              onClick={() => setActiveTab('compliance-rules')}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
            >
              View Rules →
            </button>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEFICIENCY_CATEGORY_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {DEFICIENCY_CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {DEFICIENCY_CATEGORY_DATA.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.fill }} />
                <span className="text-slate-600 dark:text-slate-400 truncate">{cat.name}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 ml-auto">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flagged Dossiers & Recent Review Activity (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Critical Flagged Dossiers (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Critical Institutional Deficiencies
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Institutions requiring immediate committee action or appellate review
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('applications')}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium flex items-center gap-1"
            >
              <span>View All ({flaggedApplications.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Institution & Application</th>
                  <th className="py-2.5 px-3">Risk</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {flaggedApplications.slice(0, 4).map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedApplicationId(app.id);
                      setActiveTab('applications');
                    }}
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {app.institutionName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {app.applicationNumber} • PID: {app.pid}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <RiskBadge risk={app.overallRiskLevel} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApplicationId(app.id);
                          setActiveTab('applications');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Review Activity Feed (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Recent Regulatory Audit Activity
            </h3>
            <button
              onClick={() => setActiveTab('audit-trail')}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
            >
              Audit Trail →
            </button>
          </div>

          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{log.timestamp}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{log.category}</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] line-clamp-1">
                  {log.action}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[180px]">{log.targetEntity}</span>
                  <span>{log.actor}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveTab('review-queue')}
            className="w-full py-2 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 rounded-lg transition-colors border border-teal-200 dark:border-teal-800/80"
          >
            Open Officer Review Worklist →
          </button>
        </div>
      </div>
    </div>
  );
};
