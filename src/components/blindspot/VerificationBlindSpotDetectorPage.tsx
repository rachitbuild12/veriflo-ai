import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  FileWarning,
  Filter,
  Flame,
  HelpCircle,
  Key,
  Layers,
  Lock,
  Radio,
  RefreshCw,
  Search,
  ServerOff,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserX,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  BlindSpotRecord,
  BlindSpotType,
  ClaimVerificationStatus,
  DocumentClaim,
} from './blindSpotModel';
import { Badge } from '../common/Badge';

export const VerificationBlindSpotDetectorPage: React.FC = () => {
  const {
    claims,
    blindSpotRecords,
    coverageSummary,
    setManualVerificationModalOpen,
    setActiveClaimForManualVerification,
    triggerAuthorizedDemoProbe,
    setSelectedDocumentId,
    setActiveTab,
    addToast,
    logAuditAction,
  } = useApp();

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>('all');
  const [isDeepScanning, setIsDeepScanning] = useState(false);

  // Filter Blind Spots
  const filteredBlindSpots = useMemo(() => {
    return blindSpotRecords.filter((spot) => {
      const matchType = selectedTypeFilter === 'all' || spot.type === selectedTypeFilter;
      const matchSev = selectedSeverityFilter === 'all' || spot.severity === selectedSeverityFilter;
      const matchStatus =
        selectedStatusFilter === 'all'
          ? true
          : selectedStatusFilter === 'open'
          ? !spot.resolved
          : spot.resolved;

      const matchSearch =
        searchTerm === '' ||
        spot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.affectedClaim.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.pid.includes(searchTerm);

      return matchType && matchSev && matchStatus && matchSearch;
    });
  }, [blindSpotRecords, selectedTypeFilter, selectedSeverityFilter, selectedStatusFilter, searchTerm]);

  // Filter Tracked Claims
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      if (claimStatusFilter === 'all') return true;
      return c.status === claimStatusFilter;
    });
  }, [claims, claimStatusFilter]);

  const handleRunDeepScan = () => {
    setIsDeepScanning(true);
    addToast(
      'info',
      'Executing cross-registry coverage audit against DigiLocker, e-Mahabhumi, and CFO portals...',
      'Deep Scan Initiated'
    );
    logAuditAction('Verification Blind-Spot Deep Scan Initiated', 'All Dossiers', 'AI_SCAN', 'Info');

    setTimeout(() => {
      setIsDeepScanning(false);
      addToast(
        'warning',
        `Deep scan finished: ${coverageSummary.verifiedCount} claims confirmed via authorized source, ${coverageSummary.openBlindSpotsCount} regulatory blind spots identified.`,
        'Coverage Audit Complete'
      );
    }, 1200);
  };

  const handleLaunchManualVerification = (claim: DocumentClaim) => {
    setActiveClaimForManualVerification(claim);
    setManualVerificationModalOpen(true);
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Blind_Spot_Type,Severity,Title,Institution,PID,Affected_Claim,What_Remains_Unverified,Next_Recommended_Action,Missing_Source,Status\n' +
      filteredBlindSpots
        .map(
          (b) =>
            `"${b.id}","${b.type}","${b.severity}","${b.title}","${b.institutionName}","${b.pid}","${b.affectedClaim}","${b.whatRemainsUnverified.replace(/"/g, '""')}","${b.nextRecommendedAction.replace(/"/g, '""')}","${b.missingSourceOrPortal}","${b.resolved ? 'Resolved' : 'Open Gap'}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'VerifloAI_Verification_Blind_Spot_Audit.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Verification blind-spot assessment exported as CSV.', 'Export Complete');
  };

  const getStatusBadge = (status: ClaimVerificationStatus) => {
    switch (status) {
      case 'Verified through authorized source':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verified (Authorized Source)
          </span>
        );
      case 'Extracted locally':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <FileText className="w-3 h-3 text-blue-600" />
            Extracted Locally (OCR)
          </span>
        );
      case 'Matched against supplied records':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
            <Layers className="w-3 h-3 text-cyan-600" />
            Matched Against Supplied
          </span>
        );
      case 'Not checked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Clock className="w-3 h-3 text-slate-500" />
            Not Checked
          </span>
        );
      case 'Source unavailable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
            <ServerOff className="w-3 h-3 text-orange-600" />
            Source Unavailable
          </span>
        );
      case 'Manual verification required':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
            <UserCheck className="w-3 h-3 text-rose-600" />
            Manual Review Required
          </span>
        );
      case 'Processing failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <FileWarning className="w-3 h-3 text-rose-600" />
            Processing Failed
          </span>
        );
      case 'Inconclusive':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Inconclusive
          </span>
        );
    }
  };

  const getBlindSpotTypeIcon = (type: BlindSpotType) => {
    switch (type) {
      case 'MISSING_SOURCE_CREDENTIALS':
        return <Key className="w-4 h-4 text-amber-500" />;
      case 'UNAVAILABLE_ISSUER_PORTAL':
        return <ServerOff className="w-4 h-4 text-rose-500" />;
      case 'MISSING_HISTORICAL_RECORDS':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'UNREADABLE_DOCUMENT':
        return <FileWarning className="w-4 h-4 text-purple-500" />;
      case 'UNSUPPORTED_DOCUMENT_TYPE':
        return <FileText className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-lg text-rose-600 dark:text-rose-400">
              <EyeOff className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Verification Blind-Spot Detector
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                {coverageSummary.openBlindSpotsCount} Active Gaps
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Exposes unverified claims, missing source credentials, unavailable issuer portals, and unsupported filings. Tracks independent issuer status separately for every document.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunDeepScan}
            disabled={isDeepScanning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDeepScanning ? 'animate-spin' : ''}`} />
            <span>{isDeepScanning ? 'Scanning Registries...' : 'Run Registry Coverage Audit'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Gap Audit</span>
          </button>
        </div>
      </div>

      {/* Demo Notice Banner */}
      <div className="px-3.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Explicit Demo Mode Notice:</strong> Simulated issuer responses and external directory handshakes are synthetic demonstration benchmarks. Veriflo AI operates strictly within authorized API channels and does not scrape restricted government portals.
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 font-bold uppercase shrink-0">
          Synthetic Guardrails Active
        </span>
      </div>

      {/* VERIFICATION COVERAGE PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Document & Claim Verification Coverage Panel
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Breakdown across {coverageSummary.totalClaims} tracked statutory assertions and evidentiary filings.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {coverageSummary.authorizedSourceCoveragePercent}% Source Verified
            </span>
            <span>•</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              {coverageSummary.unverifiedBlindSpotPercent}% Unverified Gaps
            </span>
          </div>
        </div>

        {/* 5-Bucket Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Verified */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                Verified
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1 font-mono">
              {coverageSummary.verifiedCount}
            </div>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 leading-snug">
              Verified through authorized source with digital proof
            </p>
          </div>

          {/* 2. Partially Checked */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                Partially Checked
              </span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1 font-mono">
              {coverageSummary.partiallyCheckedCount}
            </div>
            <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-1 leading-snug">
              Extracted locally (OCR) or matched against supplied PDF
            </p>
          </div>

          {/* 3. Pending */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Pending
              </span>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
              {coverageSummary.pendingCount}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              Not checked yet in current scrutiny cycle
            </p>
          </div>

          {/* 4. Unavailable */}
          <div className="p-3.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide">
                Unavailable
              </span>
              <ServerOff className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-200 mt-1 font-mono">
              {coverageSummary.unavailableCount}
            </div>
            <p className="text-[10px] text-orange-700 dark:text-orange-400 mt-1 leading-snug">
              Source unavailable or offline issuer portal
            </p>
          </div>

          {/* 5. Inconclusive */}
          <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wide">
                Inconclusive
              </span>
              <AlertOctagon className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-900 dark:text-rose-200 mt-1 font-mono">
              {coverageSummary.inconclusiveCount}
            </div>
            <p className="text-[10px] text-rose-700 dark:text-rose-400 mt-1 leading-snug">
              Manual verification required or parsing failed
            </p>
          </div>
        </div>

        {/* Visual Multi-Segment Coverage Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>Coverage Distribution Across Tracked Claims</span>
            <span>{coverageSummary.totalClaims} Claims Assessed</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden p-0.5">
            <div
              style={{ width: `${(coverageSummary.verifiedCount / Math.max(coverageSummary.totalClaims, 1)) * 100}%` }}
              className="bg-emerald-500 rounded-l-full transition-all duration-500"
              title={`Verified: ${coverageSummary.verifiedCount}`}
            />
            <div
              style={{ width: `${(coverageSummary.partiallyCheckedCount / Math.max(coverageSummary.totalClaims, 1)) * 100}%` }}
              className="bg-blue-500 transition-all duration-500"
              title={`Partially Checked: ${coverageSummary.partiallyCheckedCount}`}
            />
            <div
              style={{ width: `${(coverageSummary.pendingCount / Math.max(coverageSummary.totalClaims, 1)) * 100}%` }}
              className="bg-slate-400 transition-all duration-500"
              title={`Pending: ${coverageSummary.pendingCount}`}
            />
            <div
              style={{ width: `${(coverageSummary.unavailableCount / Math.max(coverageSummary.totalClaims, 1)) * 100}%` }}
              className="bg-orange-500 transition-all duration-500"
              title={`Source Unavailable: ${coverageSummary.unavailableCount}`}
            />
            <div
              style={{ width: `${(coverageSummary.inconclusiveCount / Math.max(coverageSummary.totalClaims, 1)) * 100}%` }}
              className="bg-rose-500 rounded-r-full transition-all duration-500"
              title={`Inconclusive: ${coverageSummary.inconclusiveCount}`}
            />
          </div>
        </div>

        {/* SOURCE VERIFICATION INTEGRITY BARRIER NOTICE */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-bold text-slate-900 dark:text-white">
              Statutory Source Verification Barrier:
            </span>{' '}
            Only claims with a genuine, successful verification result recorded with independent source identity, timestamp, and reference citation can be marked{' '}
            <strong className="text-emerald-700 dark:text-emerald-400">Verified through authorized source</strong>.{' '}
            <em>A local OCR match, a valid-looking PDF, an AI model response, or a matching database field never counts as independent issuer verification.</em>
          </div>
        </div>
      </div>

      {/* REGULATORY BLIND SPOTS SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Identified Regulatory Blind Spots ({filteredBlindSpots.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Categorized gaps requiring manual scrutiny, external authority credentials, or physical EVC inspection.
            </p>
          </div>

          {/* Blind Spot Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Gap Categories</option>
              <option value="MISSING_SOURCE_CREDENTIALS">Missing Source Credentials</option>
              <option value="UNAVAILABLE_ISSUER_PORTAL">Unavailable Issuer Portals</option>
              <option value="MISSING_HISTORICAL_RECORDS">Missing Historical Records</option>
              <option value="UNREADABLE_DOCUMENT">Unreadable Documents</option>
              <option value="UNSUPPORTED_DOCUMENT_TYPE">Unsupported Document Types</option>
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="open">Open Gaps ({blindSpotRecords.filter((b) => !b.resolved).length})</option>
              <option value="resolved">Resolved Gaps ({blindSpotRecords.filter((b) => b.resolved).length})</option>
              <option value="all">All Gaps</option>
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search blind spots by title, college name, PID, or affected claim..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs"
          />
        </div>

        {/* Blind Spot Cards List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredBlindSpots.map((spot) => {
            const linkedClaim = claims.find((c) => c.id === spot.claimId);

            return (
              <div
                key={spot.id}
                className={`p-5 rounded-2xl border transition-all duration-200 shadow-xs bg-white dark:bg-slate-900 ${
                  spot.resolved
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : spot.severity === 'Critical'
                    ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/30 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getBlindSpotTypeIcon(spot.type)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                          {spot.type.replace(/_/g, ' ')}
                        </span>
                        <Badge
                          variant={
                            spot.severity === 'Critical' ? 'danger' : spot.severity === 'High' ? 'warning' : 'primary'
                          }
                        >
                          {spot.severity}
                        </Badge>
                        {spot.resolved ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Remediated / Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Open Blind Spot
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {spot.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {spot.institutionName} • PID: <span className="font-mono">{spot.pid}</span>
                      </p>
                    </div>
                  </div>

                  {/* Top Right Affected Claim Tag */}
                  <div className="text-right sm:shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Target Assertion
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {spot.affectedClaim}
                    </span>
                  </div>
                </div>

                {/* Explanation: What Remains Unverified */}
                <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      What Remains Unverified
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                      {spot.whatRemainsUnverified}
                    </p>
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                      Target Authority: <strong>{spot.missingSourceOrPortal}</strong>
                    </div>
                  </div>

                  {/* Recommendation: Next Recommended Action */}
                  <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5" />
                      Next Recommended Regulatory Action
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                      {spot.nextRecommendedAction}
                    </p>
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-teal-200/60 dark:border-teal-800/60">
                      Detected: {spot.detectedAt}
                    </div>
                  </div>
                </div>

                {/* Resolution Record if Resolved */}
                {spot.resolved && spot.resolutionRecord && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                    <div>
                      <strong>Audit Resolution: </strong>
                      <span>{spot.resolutionRecord.resolutionNotes}</span>
                      <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        By {spot.resolutionRecord.resolvedBy} on {new Date(spot.resolutionRecord.resolvedAt).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 font-bold">
                      {spot.resolutionRecord.resultingStatus}
                    </span>
                  </div>
                )}

                {/* Action Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {spot.documentId && (
                      <button
                        onClick={() => {
                          setSelectedDocumentId(spot.documentId!);
                          setActiveTab('document-verification');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect Document</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Trigger Simulated Demo Probe */}
                    {linkedClaim && (
                      <button
                        onClick={() => triggerAuthorizedDemoProbe(linkedClaim.id)}
                        className="px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-1 transition-colors"
                        title="Simulate external gateway handshake in explicitly labeled demo mode"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Simulate Issuer Probe (Demo)</span>
                      </button>
                    )}

                    {/* Manual Verification Workflow Button */}
                    {linkedClaim && (
                      <button
                        onClick={() => handleLaunchManualVerification(linkedClaim)}
                        className="px-3 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Manual Officer Verification</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBlindSpots.length === 0 && (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No Blind Spots Found For Active Criteria
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                All claims either meet regulatory criteria or have been addressed through manual scrutiny and authorized handshakes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* TRACKED DOCUMENTS & CLAIMS AUDIT TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              Granular Document Claim Status Registry ({filteredClaims.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Regulatory ledger tracking verification status separately for every relevant document and claim.
            </p>
          </div>

          {/* Claim Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filter Status:</span>
            <select
              value={claimStatusFilter}
              onChange={(e) => setClaimStatusFilter(e.target.value)}
              className="py-1 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Statuses ({claims.length})</option>
              <option value="Verified through authorized source">Verified through authorized source</option>
              <option value="Extracted locally">Extracted locally</option>
              <option value="Matched against supplied records">Matched against supplied records</option>
              <option value="Not checked">Not checked</option>
              <option value="Source unavailable">Source unavailable</option>
              <option value="Manual verification required">Manual verification required</option>
              <option value="Processing failed">Processing failed</option>
              <option value="Inconclusive">Inconclusive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Claim ID & Document</th>
                <th className="py-3 px-4">Institution / PID</th>
                <th className="py-3 px-4">Claim Type & Observed Value</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4">Independent Evidence Reference</th>
                <th className="py-3 px-4 text-right">Officer Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] text-slate-400 font-bold block">
                      {claim.id}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate block max-w-[200px]" title={claim.sourceDocumentName}>
                      {claim.sourceDocumentName}
                    </span>
                    {claim.pageNumber && (
                      <span className="text-[10px] text-slate-400">Page {claim.pageNumber}</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[180px]" title={claim.institutionName}>
                      {claim.institutionName}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">PID: {claim.pid}</span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {claim.claimType}
                    </div>
                    <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium truncate max-w-[220px]" title={claim.claimedValue}>
                      "{claim.claimedValue}"
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {getStatusBadge(claim.status)}
                  </td>

                  <td className="py-3 px-4">
                    {claim.authorizedEvidence ? (
                      <div className="text-[11px] max-w-[220px]">
                        <span className="font-medium text-emerald-800 dark:text-emerald-300 block truncate" title={claim.authorizedEvidence.sourceIdentity}>
                          {claim.authorizedEvidence.sourceIdentity}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 block truncate" title={claim.authorizedEvidence.evidenceReference}>
                          Ref: {claim.authorizedEvidence.evidenceReference}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {claim.statusReason || 'Pending independent verification'}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleLaunchManualVerification(claim)}
                      className="px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200 dark:border-teal-800 inline-flex items-center gap-1"
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>Verify Manually</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
