import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Building,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileCode,
  FileSpreadsheet,
  FileText,
  FileWarning,
  Filter,
  Flame,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Split,
  Tag,
  Trash2,
  Upload,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ClaimedFacility,
  FacilityType,
  ImageAnnotation,
  ImageQualityIssue,
  InfrastructureEvidence,
  InfrastructureEvidenceType,
  MetadataAnomaly,
  MissingEvidenceItem,
  validateInfrastructureClaimProof,
} from './infrastructureModel';
import { Badge } from '../common/Badge';

const FACILITY_TYPES: Array<FacilityType | 'All'> = [
  'All',
  'Instructional Area',
  'Laboratories & Workshops',
  'Computer Centers & Server Rooms',
  'Library & Reading Rooms',
  'Administrative & Faculty Offices',
  'Life Safety & Fire Installations',
  'Barrier-Free & Divyangjan Access',
  'Campus Grounds & Outdoor Amenities',
];

export const InfrastructureReviewPage: React.FC = () => {
  const {
    facilities,
    infrastructureEvidence,
    missingEvidenceList,
    addEvidenceAnnotation,
    confirmAiAnnotation,
    deleteAnnotation,
    recordMissingEvidence,
    updateEvidenceReviewerVerdict,
    uploadInfrastructureEvidence,
    setActiveTab,
    addToast,
    logAuditAction,
  } = useApp();

  // Filters
  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityType | 'All'>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Modals
  const [annotatingEvidence, setAnnotatingEvidence] = useState<InfrastructureEvidence | null>(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareItemA, setCompareItemA] = useState<InfrastructureEvidence | null>(null);
  const [compareItemB, setCompareItemB] = useState<InfrastructureEvidence | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [missingEvidenceModalOpen, setMissingEvidenceModalOpen] = useState(false);
  const [selectedFacilityForMissing, setSelectedFacilityForMissing] = useState<ClaimedFacility | null>(null);
  const [activeTabSubView, setActiveTabSubView] = useState<'claims' | 'gallery' | 'missing'>('claims');

  // New annotation drafting state
  const [newPinCoords, setNewPinCoords] = useState<{ x: number; y: number } | null>(null);
  const [newPinLabel, setNewPinLabel] = useState('');
  const [newPinCategory, setNewPinCategory] = useState('Equipment Deficiency');
  const [newPinSeverity, setNewPinSeverity] = useState<'Critical' | 'Major' | 'Minor' | 'Observation'>('Major');
  const [newPinNotes, setNewPinNotes] = useState('');

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFacilityType, setUploadFacilityType] = useState<FacilityType>('Laboratories & Workshops');
  const [uploadEvidenceType, setUploadEvidenceType] = useState<InfrastructureEvidenceType>('Photograph');
  const [uploadFacilityId, setUploadFacilityId] = useState(facilities[0]?.id || '');
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false);

  // Missing Evidence Form State
  const [missingDocType, setMissingDocType] = useState('Registered Architect Built-up Area Certificate');
  const [missingReason, setMissingReason] = useState('Photograph submitted without statutory floor dimensions or seal.');
  const [missingAction, setMissingAction] = useState('Issue Deficiency Notice requiring licensed COA architect endorsement within 15 days.');
  const [missingSeverity, setMissingSeverity] = useState<'Critical' | 'Major' | 'Minor'>('Critical');

  // Filtered facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchType = selectedFacilityType === 'All' || f.facilityType === selectedFacilityType;
      const matchStatus =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'compliant' && f.status === 'Compliant') ||
        (selectedStatusFilter === 'deficit' && f.status === 'Deficit Flagged') ||
        (selectedStatusFilter === 'pending' && f.status === 'Pending Review') ||
        (selectedStatusFilter === 'inconclusive' && f.status === 'Inconclusive');
      const matchSearch =
        searchQuery.trim() === '' ||
        f.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.buildingBlock.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchStatus && matchSearch;
    });
  }, [facilities, selectedFacilityType, selectedStatusFilter, searchQuery]);

  // Filtered evidence gallery
  const filteredEvidence = useMemo(() => {
    return infrastructureEvidence.filter((e) => {
      const matchType = selectedFacilityType === 'All' || e.facilityType === selectedFacilityType;
      const matchSearch =
        searchQuery.trim() === '' ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.aiClassification.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [infrastructureEvidence, selectedFacilityType, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalFacilities = facilities.length;
    const compliantCount = facilities.filter((f) => f.status === 'Compliant').length;
    const deficitCount = facilities.filter((f) => f.status === 'Deficit Flagged').length;
    const totalPhotos = infrastructureEvidence.filter((e) => e.evidenceType === 'Photograph').length;
    const totalBlueprints = infrastructureEvidence.filter(
      (e) => e.evidenceType === 'Floor Plan / Blueprint' || e.evidenceType === 'CAD Drawing'
    ).length;
    const totalQualityAlerts = infrastructureEvidence.reduce((acc, curr) => acc + curr.qualityIssues.length, 0);
    const totalMetadataAnomalies = infrastructureEvidence.reduce(
      (acc, curr) => acc + curr.metadataAnomalies.length,
      0
    );
    const openMissingDocs = missingEvidenceList.filter((m) => !m.resolved).length;

    return {
      totalFacilities,
      compliantCount,
      deficitCount,
      totalPhotos,
      totalBlueprints,
      totalQualityAlerts,
      totalMetadataAnomalies,
      openMissingDocs,
    };
  }, [facilities, infrastructureEvidence, missingEvidenceList]);

  // Handle image click to drop annotation pin
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setNewPinCoords({ x, y });
  };

  const handleSavePin = () => {
    if (!annotatingEvidence || !newPinCoords || !newPinLabel.trim()) return;

    addEvidenceAnnotation(annotatingEvidence.id, {
      evidenceId: annotatingEvidence.id,
      x: newPinCoords.x,
      y: newPinCoords.y,
      label: newPinLabel.trim(),
      category: newPinCategory,
      severity: newPinSeverity,
      notes: newPinNotes.trim() || 'Officer visual callout during infrastructure verification.',
      annotatedBy: 'Regional Scrutiny Officer (WRO)',
      isAiSuggestion: false,
      isReviewerConfirmed: true,
    });

    // Refresh currently open modal item
    const updated = infrastructureEvidence.find((e) => e.id === annotatingEvidence.id);
    if (updated) setAnnotatingEvidence(updated);

    setNewPinCoords(null);
    setNewPinLabel('');
    setNewPinNotes('');
  };

  const handleConfirmAiSuggestion = (annotationId: string) => {
    if (!annotatingEvidence) return;
    confirmAiAnnotation(annotatingEvidence.id, annotationId);
    const updated = infrastructureEvidence.find((e) => e.id === annotatingEvidence.id);
    if (updated) setAnnotatingEvidence(updated);
  };

  const handleDeletePin = (annotationId: string) => {
    if (!annotatingEvidence) return;
    deleteAnnotation(annotatingEvidence.id, annotationId);
    const updated = infrastructureEvidence.find((e) => e.id === annotatingEvidence.id);
    if (updated) setAnnotatingEvidence(updated);
  };

  const handleOpenComparison = (facility: ClaimedFacility) => {
    const evs = infrastructureEvidence.filter((e) => e.linkedFacilityId === facility.id);
    if (evs.length >= 2) {
      setCompareItemA(evs[0]);
      setCompareItemB(evs[1]);
    } else if (evs.length === 1) {
      setCompareItemA(evs[0]);
      setCompareItemB(infrastructureEvidence.find((e) => e.id !== evs[0].id) || evs[0]);
    } else {
      setCompareItemA(infrastructureEvidence[0] || null);
      setCompareItemB(infrastructureEvidence[1] || null);
    }
    setCompareModalOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      addToast('error', 'Please choose a file to upload.', 'File Missing');
      return;
    }
    setIsSubmittingUpload(true);
    try {
      const selectedFac = facilities.find((f) => f.id === uploadFacilityId);
      await uploadInfrastructureEvidence(uploadFile, {
        facilityId: uploadFacilityId,
        title: uploadTitle.trim() || uploadFile.name,
        evidenceType: uploadEvidenceType,
        facilityType: uploadFacilityType,
        institutionName: 'Veermata Jijabai Technological Institute (VJTI) [Synthetic]',
      });
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  const handleSaveMissingEvidence = () => {
    if (!selectedFacilityForMissing) return;

    recordMissingEvidence({
      facilityClaimId: selectedFacilityForMissing.id,
      facilityName: selectedFacilityForMissing.facilityName,
      missingEvidenceType: missingDocType,
      reason: missingReason,
      recommendedNextAction: missingAction,
      severity: missingSeverity,
      recordedBy: 'Regional Scrutiny Officer (WRO)',
    });

    setMissingEvidenceModalOpen(false);
    setSelectedFacilityForMissing(null);
  };

  const handleExportFindingsMemo = () => {
    const memoData = {
      platform: 'Veriflo AI - Regulatory Infrastructure Evidence Verification Engine',
      regulatoryFramework: 'AICTE Approval Process Handbook (APH 2025-26)',
      exportTimestamp: new Date().toISOString(),
      officer: 'Regional Scrutiny Officer (WRO)',
      disclaimer:
        'REGULATORY SAFEGUARD: Visual differences or photographic submissions do not independently establish fraud. Ground physical inspection by an Expert Visiting Committee (EVC) is legally required before punitive action.',
      summaryStats: stats,
      facilitiesReview: facilities.map((f) => ({
        id: f.id,
        facilityName: f.facilityName,
        type: f.facilityType,
        claimedAreaSqM: f.claimedAreaSqM,
        status: f.status,
        clause: f.complianceClause,
        evidenceCount: f.evidenceIds.length,
        proofValidation: validateInfrastructureClaimProof(
          f.evidenceIds.some((id) => infrastructureEvidence.find((e) => e.id === id)?.evidenceType === 'Photograph'),
          f.evidenceIds.some((id) => infrastructureEvidence.find((e) => e.id === id)?.evidenceType === 'Statutory Certificate'),
          false
        ),
      })),
      flaggedDeficits: missingEvidenceList,
      anomaliesDetected: infrastructureEvidence
        .filter((e) => e.qualityIssues.length > 0 || e.metadataAnomalies.length > 0)
        .map((e) => ({
          evidenceId: e.id,
          title: e.title,
          qualityIssues: e.qualityIssues,
          metadataAnomalies: e.metadataAnomalies,
          sha256Hash: e.sha256Hash,
          isDuplicate: e.isDuplicate,
        })),
    };

    const blob = new Blob([JSON.stringify(memoData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Veriflo-Infrastructure-Evidence-Review-Memo-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast('success', 'Official Infrastructure Scrutiny Memo exported.', 'Export Complete');
    logAuditAction('Exported Infrastructure Review Memo', 'Institutional Facility Dossier', 'STATUS_CHANGE', 'Info');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Veriflo AI</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Inspection & Regulatory Auditing</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Infrastructure Evidence Review
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <span>Infrastructure Evidence Review</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Visual AI & CAD Analysis
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
            Correlate claimed institutional facilities with architectural blueprints, cadastral drawings, and geotagged photographs. Classify image quality, detect EXIF tampering, and pinpoint deficiencies with GovTech guardrails.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Evidence</span>
          </button>
          <button
            onClick={() => {
              if (infrastructureEvidence.length >= 2) {
                setCompareItemA(infrastructureEvidence[0]);
                setCompareItemB(infrastructureEvidence[1]);
                setCompareModalOpen(true);
              } else {
                addToast('warning', 'Need at least 2 evidence records to compare.', 'Insufficient Evidence');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors"
          >
            <Split className="w-3.5 h-3.5 text-blue-500" />
            <span>Side-by-Side Compare</span>
          </button>
          <button
            onClick={handleExportFindingsMemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Export Findings Memo</span>
          </button>
        </div>
      </div>

      {/* STATUTORY REGULATORY GUARDRAIL BANNER */}
      <div className="bg-gradient-to-r from-blue-900/15 via-teal-900/10 to-indigo-900/15 dark:from-blue-950/40 dark:via-teal-950/30 dark:to-indigo-950/40 border-2 border-blue-500/30 rounded-2xl p-4 text-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <span>Statutory Infrastructure Evidentiary Rule (AICTE APH 2025-26 § 4.3 & VI)</span>
              <span className="px-2 py-0.2 rounded text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-mono">
                GovTech Guardrail Enforced
              </span>
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Non-Authoritative Photo Rule:</strong> A photograph or 3D rendering alone does <em>not</em> legally prove that a laboratory is functional, that room dimensions satisfy statutory square-meter thresholds, or that an infrastructure facility physically exists. Independent corroboration (Council of Architecture registered architect endorsement, municipal Occupancy Certificate, or on-site Expert Visiting Committee measurement) is required before final regulatory approval.
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Claimed Facilities</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
            {stats.totalFacilities}
          </span>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
            {stats.compliantCount} Verified Compliant
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Photographs Audited</span>
          <span className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1 block">
            {stats.totalPhotos}
          </span>
          <span className="text-[10px] text-slate-500">EXIF & GPS Scanned</span>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Blueprints / CAD</span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">
            {stats.totalBlueprints}
          </span>
          <span className="text-[10px] text-slate-500">Dimension Calibrated</span>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Quality Issues Flagged</span>
          <span className="text-xl font-bold text-amber-500 mt-1 block">
            {stats.totalQualityAlerts}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">Blur / Low Resolution</span>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Metadata Anomalies</span>
          <span className="text-xl font-bold text-rose-500 mt-1 block">
            {stats.totalMetadataAnomalies}
          </span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400">Photoshop / Duplicate Hash</span>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Missing Documents</span>
          <span className="text-xl font-bold text-red-600 dark:text-red-400 mt-1 block">
            {stats.openMissingDocs}
          </span>
          <span className="text-[10px] text-red-500">Deficits Recorded</span>
        </div>
      </div>

      {/* MAIN VIEW CONTROLS & TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTabSubView('claims')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTabSubView === 'claims'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Claimed Facilities vs Evidence</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-800 text-white font-mono">
              {facilities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTabSubView('gallery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTabSubView === 'gallery'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Evidence Gallery & Visual Pins</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono">
              {infrastructureEvidence.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTabSubView('missing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTabSubView === 'missing'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileWarning className="w-3.5 h-3.5 text-amber-400" />
            <span>Missing Evidence Registry</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono">
              {missingEvidenceList.length}
            </span>
          </button>
        </div>

        {/* Global Search within Infrastructure */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility, room, block..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* FACILITY TYPE PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mr-1 shrink-0">
          Facility Type:
        </span>
        {FACILITY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedFacilityType(type)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedFacilityType === type
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* SUBVIEW 1: CLAIMED FACILITIES VS EVIDENCE */}
      {activeTabSubView === 'claims' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredFacilities.map((facility) => {
              const linkedEvs = infrastructureEvidence.filter((e) => e.linkedFacilityId === facility.id);
              const hasPhoto = linkedEvs.some((e) => e.evidenceType === 'Photograph');
              const hasBlueprint = linkedEvs.some(
                (e) => e.evidenceType === 'Floor Plan / Blueprint' || e.evidenceType === 'CAD Drawing'
              );
              const hasCert = linkedEvs.some((e) => e.evidenceType === 'Statutory Certificate');

              const proofValidation = validateInfrastructureClaimProof(hasPhoto, hasCert || hasBlueprint, false);

              return (
                <div
                  key={facility.id}
                  className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-teal-600 dark:text-teal-400 font-bold">
                          {facility.id}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {facility.facilityType}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
                          {facility.buildingBlock} / {facility.roomNumber}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {facility.facilityName}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Regulatory Clause: {facility.complianceClause}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          facility.status === 'Compliant'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : facility.status === 'Deficit Flagged'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : facility.status === 'Inconclusive'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {facility.status}
                      </span>
                    </div>
                  </div>

                  {/* Dimension & Proof Safeguard Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Claimed Physical Metrics</span>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Area: <span className="font-mono text-teal-600 dark:text-teal-400">{facility.claimedAreaSqM} sq.m</span></span>
                        <span>Capacity: <span className="font-mono">{facility.claimedCapacity} seats</span></span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Supporting Evidence Filed</span>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                            hasPhoto
                              ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          <Camera className="w-3 h-3" />
                          Photo ({linkedEvs.filter((e) => e.evidenceType === 'Photograph').length})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                            hasBlueprint
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                          Blueprint
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                            hasCert
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          <FileCheck2 className="w-3 h-3" />
                          Cert
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Regulatory Evidentiary Sufficiency</span>
                      <div className="mt-1">
                        {proofValidation.valid ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Independent Proof Verified
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Photo Only (Non-Authoritative)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Guardrail Callout when proof is insufficient */}
                  {!proofValidation.valid && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                      <AlertOctagon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Statutory Caution:</span> {proofValidation.reason}
                      </div>
                    </div>
                  )}

                  {/* Linked Evidence Items & Direct Actions */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Submitted Evidence Dossiers ({linkedEvs.length})
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {linkedEvs.map((evidence) => (
                        <div
                          key={evidence.id}
                          className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex flex-col justify-between space-y-2"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                              <span className="font-mono text-teal-600 dark:text-teal-400">{evidence.id}</span>
                              <span>{evidence.evidenceType}</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                              {evidence.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {evidence.aiClassification} ({evidence.aiConfidence}% match)
                            </p>

                            {/* Anomaly Badges */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {evidence.qualityIssues.map((q) => (
                                <span
                                  key={q}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold"
                                >
                                  {q}
                                </span>
                              ))}
                              {evidence.metadataAnomalies.map((m) => (
                                <span
                                  key={m}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold"
                                >
                                  {m}
                                </span>
                              ))}
                              {evidence.annotations.length > 0 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold">
                                  {evidence.annotations.length} Pins ({evidence.annotations.filter((a) => a.isReviewerConfirmed).length} Confirmed)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {evidence.fileSize}
                            </span>
                            <button
                              onClick={() => setAnnotatingEvidence(evidence)}
                              className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect & Pin</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions for Facility */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenComparison(facility)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Split className="w-3.5 h-3.5 text-blue-500" />
                        <span>Compare Facility Images</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedFacilityForMissing(facility);
                          setMissingEvidenceModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-amber-300 dark:border-amber-800"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record Missing Evidence</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => {
                          setActiveTab('evidence-dependency-graph');
                          addToast('info', `Navigated to Evidence Dependency Graph for ${facility.facilityName}.`, 'Graph Filtered');
                        }}
                        className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>View in Dependency Graph</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBVIEW 2: EVIDENCE GALLERY & INTERACTIVE VISUAL PINS */}
      {activeTabSubView === 'gallery' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvidence.map((evidence) => {
              const confirmedPins = evidence.annotations.filter((a) => a.isReviewerConfirmed).length;
              const aiPins = evidence.annotations.filter((a) => a.isAiSuggestion && !a.isReviewerConfirmed).length;

              return (
                <div
                  key={evidence.id}
                  className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  {/* Image Preview Container */}
                  <div
                    onClick={() => setAnnotatingEvidence(evidence)}
                    className="relative h-48 bg-slate-950 cursor-pointer group overflow-hidden flex items-center justify-center"
                  >
                    <img
                      src={evidence.fileUrl}
                      alt={evidence.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />

                    {/* Overlay Tag */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/20">
                        {evidence.evidenceType}
                      </span>
                      {evidence.isDuplicate && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600/90 text-white">
                          Duplicate Hash
                        </span>
                      )}
                    </div>

                    {/* Pins count pill */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-lg text-[10px] font-semibold bg-black/70 backdrop-blur-md text-white flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-teal-400" />
                      <span>{evidence.annotations.length} Annotations</span>
                    </div>

                    <div className="absolute inset-0 bg-teal-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Open Interactive Annotator</span>
                      </span>
                    </div>
                  </div>

                  {/* Evidence Card Details */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-mono text-teal-600 dark:text-teal-400">{evidence.id}</span>
                        <span>{new Date(evidence.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {evidence.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        Facility: {facilities.find((f) => f.id === evidence.linkedFacilityId)?.facilityName || evidence.facilityType}
                      </p>

                      {/* AI Classification & EXIF pill */}
                      <div className="mt-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-teal-500" />
                            <span>AI Classification:</span>
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {evidence.aiConfidence}% match
                          </span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 line-clamp-1 font-mono text-[10px]">
                          {evidence.aiClassification}
                        </div>
                      </div>

                      {/* Quality Issues & Metadata Anomalies */}
                      {(evidence.qualityIssues.length > 0 || evidence.metadataAnomalies.length > 0) && (
                        <div className="mt-2 space-y-1">
                          {evidence.qualityIssues.map((q) => (
                            <div
                              key={q}
                              className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>Quality: {q}</span>
                            </div>
                          ))}
                          {evidence.metadataAnomalies.map((m) => (
                            <div
                              key={m}
                              className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 flex items-center gap-1"
                            >
                              <AlertOctagon className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>Forensic: {m}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {confirmedPins > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {confirmedPins} Confirmed
                          </span>
                        )}
                        {aiPins > 0 && (
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                            {aiPins} AI Suggestions
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setAnnotatingEvidence(evidence)}
                        className="text-teal-600 dark:text-teal-400 font-semibold hover:underline text-xs flex items-center gap-1"
                      >
                        <span>Annotate</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBVIEW 3: MISSING EVIDENCE REGISTRY */}
      {activeTabSubView === 'missing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recorded Regulatory Deficiencies & Missing Evidence
              </h3>
              <p className="text-xs text-slate-500">
                Statutory documents, architect certifications, or physical proofs required under AICTE APH Chapter VI.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedFacilityForMissing(facilities[0] || null);
                setMissingEvidenceModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Deficit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {missingEvidenceList.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-rose-600 dark:text-rose-400 font-bold">
                      {item.id}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        item.severity === 'Critical'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {item.severity} Deficiency
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{item.facilityName}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.missingEvidenceType}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.reason}
                  </p>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                    Next Action: {item.recommendedNextAction}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      addToast('info', `Issued formal deficiency notice for ${item.missingEvidenceType}.`, 'Deficiency Notice');
                      logAuditAction(`Deficiency Notice Issued: ${item.missingEvidenceType}`, item.facilityName, 'DEFICIENCY_NOTICE', 'Warning');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
                  >
                    Issue Notice to Institute
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('blind-spot-detector');
                      addToast('info', 'Switched to Verification Blind-Spot Detector.', 'Detector Linked');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                  >
                    View in Blind-Spot Detector
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: INTERACTIVE IMAGE & CAD ANNOTATOR OVERLAY                        */}
      {/* ========================================================================= */}
      {annotatingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-teal-600 dark:text-teal-400 font-bold">
                    {annotatingEvidence.id}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {annotatingEvidence.evidenceType}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    SHA-256: {annotatingEvidence.sha256Hash.substring(0, 16)}...
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {annotatingEvidence.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAnnotatingEvidence(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Left Canvas + Right Annotation List / Form */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Interactive Visual Canvas (2 cols) */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-teal-500" />
                    <span>Click anywhere on image/plan to drop a visual scrutiny pin</span>
                  </span>
                  <span className="text-[11px] font-mono">
                    {annotatingEvidence.annotations.length} Pins Placed
                  </span>
                </div>

                {/* Canvas Container */}
                <div
                  onClick={handleImageClick}
                  className="relative w-full h-[450px] bg-slate-950 rounded-xl overflow-hidden cursor-crosshair border-2 border-slate-700 select-none shadow-inner flex items-center justify-center group"
                >
                  <img
                    src={annotatingEvidence.fileUrl}
                    alt={annotatingEvidence.title}
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {/* Render Existing Annotations Pins */}
                  {annotatingEvidence.annotations.map((pin) => {
                    const isAi = pin.isAiSuggestion && !pin.isReviewerConfirmed;
                    return (
                      <div
                        key={pin.id}
                        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Clicking existing pin
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group/pin z-20"
                      >
                        {/* Pin Visual Indicator */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-125 ${
                            isAi
                              ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/30 animate-pulse'
                              : pin.severity === 'Critical'
                              ? 'bg-rose-600 text-white ring-4 ring-rose-600/30'
                              : pin.severity === 'Major'
                              ? 'bg-amber-500 text-white ring-4 ring-amber-500/30'
                              : 'bg-emerald-600 text-white ring-4 ring-emerald-600/30'
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>

                        {/* Tooltip on Hover */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 hidden group-hover/pin:block w-56 p-2.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none z-30 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold">
                            <span className={isAi ? 'text-cyan-400' : 'text-emerald-400'}>
                              {isAi ? 'AI Suggestion' : 'Officer Confirmed'}
                            </span>
                            <span className="text-slate-400">{pin.severity}</span>
                          </div>
                          <p className="font-bold text-white text-xs leading-tight">{pin.label}</p>
                          <p className="text-[11px] text-slate-300 leading-snug">{pin.notes}</p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Drafting new pin indicator */}
                  {newPinCoords && (
                    <div
                      style={{ left: `${newPinCoords.x}%`, top: `${newPinCoords.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center ring-4 ring-teal-500/50 animate-bounce z-30"
                    >
                      <Plus className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Form to save new pin */}
                {newPinCoords && (
                  <div className="p-4 bg-teal-500/10 border-2 border-teal-500/40 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>Place Pin at Coordinates ({newPinCoords.x}%, {newPinCoords.y}%)</span>
                      </span>
                      <button
                        onClick={() => setNewPinCoords(null)}
                        className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Deficiency Title / Observation
                        </label>
                        <input
                          type="text"
                          value={newPinLabel}
                          onChange={(e) => setNewPinLabel(e.target.value)}
                          placeholder="e.g. Unshielded High-Voltage Busbar"
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Category
                        </label>
                        <select
                          value={newPinCategory}
                          onChange={(e) => setNewPinCategory(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                        >
                          <option value="Equipment Deficiency">Equipment Deficiency</option>
                          <option value="Safety Hazard">Safety Hazard</option>
                          <option value="Architectural Discrepancy">Architectural Discrepancy</option>
                          <option value="Tampering Signal">Tampering Signal</option>
                          <option value="General Observation">General Observation</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Scrutiny Notes & Justification
                        </label>
                        <textarea
                          rows={2}
                          value={newPinNotes}
                          onChange={(e) => setNewPinNotes(e.target.value)}
                          placeholder="Detail observed regulatory deviation according to AICTE APH Chapter VI..."
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleSavePin}
                        className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                      >
                        Confirm & Save Pin
                      </button>
                    </div>
                  </div>
                )}

                {/* Statutory Guardrail Reminder */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Regulatory Guardrail Notice:</strong> Pins placed here represent scrutinizer annotations. Visual observations do not replace statutory physical inspections conducted by an Expert Visiting Committee (EVC).
                </div>
              </div>

              {/* Right Column: Existing Pins List & Reviewer Determination (1 col) */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Scrutiny Pins ({annotatingEvidence.annotations.length})
                  </h4>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {annotatingEvidence.annotations.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No pins placed yet. Click on the image to drop a pin.
                      </div>
                    ) : (
                      annotatingEvidence.annotations.map((pin) => {
                        const isAi = pin.isAiSuggestion && !pin.isReviewerConfirmed;
                        return (
                          <div
                            key={pin.id}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  isAi
                                    ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                }`}
                              >
                                {isAi ? 'AI Suggestion' : 'Officer Confirmed'}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-slate-400">
                                  ({pin.x}%, {pin.y}%)
                                </span>
                                <button
                                  onClick={() => handleDeletePin(pin.id)}
                                  className="text-slate-400 hover:text-rose-500"
                                  title="Delete Pin"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{pin.label}</p>
                              <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 leading-snug">
                                {pin.notes}
                              </p>
                            </div>

                            {/* Convert AI suggestion to Officer Confirmed */}
                            {isAi && (
                              <button
                                onClick={() => handleConfirmAiSuggestion(pin.id)}
                                className="w-full mt-1.5 py-1 px-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Confirm as Officer Finding</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Reviewer Determination & Verdict */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Officer Evidentiary Determination
                  </h4>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Verdict
                    </label>
                    <select
                      value={annotatingEvidence.reviewerVerdict}
                      onChange={(e) => {
                        updateEvidenceReviewerVerdict(
                          annotatingEvidence.id,
                          e.target.value as any,
                          annotatingEvidence.reviewerNotes || 'Officer review verdict updated.',
                          'Regional Scrutiny Officer (WRO)'
                        );
                        setAnnotatingEvidence((prev) =>
                          prev ? { ...prev, reviewerVerdict: e.target.value as any } : null
                        );
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                    >
                      <option value="Unreviewed">Unreviewed</option>
                      <option value="Satisfactory Supporting Evidence">Satisfactory Supporting Evidence</option>
                      <option value="Deficiency Flagged">Deficiency Flagged</option>
                      <option value="Inconclusive / Physical EVC Needed">Inconclusive / Physical EVC Needed</option>
                    </select>
                  </div>

                  {/* Review History Trail */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Audit Timeline ({annotatingEvidence.reviewHistory.length})
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 text-[10px]">
                      {annotatingEvidence.reviewHistory.map((h, i) => (
                        <div key={i} className="p-2 rounded bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{h.reviewedBy}</span>
                            <span>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 mt-0.5">{h.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">
                AICTE APH 2025-26 Visual Forensics Sub-Engine
              </span>
              <button
                onClick={() => setAnnotatingEvidence(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold"
              >
                Close Annotator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SIDE-BY-SIDE IMAGE COMPARISON TOOL                               */}
      {/* ========================================================================= */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Split className="w-3 h-3" />
                  <span>Dual Dossier Forensic Comparison</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Side-by-Side Infrastructure Evidence Comparative Viewer
                </h3>
              </div>
              <button
                onClick={() => setCompareModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MANDATORY GOVTECH REGULATORY CAUTION */}
            <div className="p-4 bg-amber-500/10 border-b border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-amber-600 dark:text-amber-400">
                    Mandatory GovTech Regulatory Caution (APH 2025-26 § 4.3)
                  </h4>
                  <p className="leading-relaxed">
                    Visual differences between photographs or architectural drawings do <strong>NOT</strong> independently establish fraud or regulatory non-compliance. Variations may naturally arise from seasonal maintenance, lighting shifts, lens focal length distortion, or legitimate room repurposing. A ground physical inspection by an <strong>Expert Visiting Committee (EVC)</strong> is legally mandatory before issuing deficiency penal actions.
                  </p>
                </div>
              </div>
            </div>

            {/* Side-by-Side Dual Column Viewer */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Evidence A */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Evidence File A
                  </span>
                  <select
                    value={compareItemA?.id || ''}
                    onChange={(e) => {
                      const item = infrastructureEvidence.find((ev) => ev.id === e.target.value);
                      if (item) setCompareItemA(item);
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  >
                    {infrastructureEvidence.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.id}: {ev.title}
                      </option>
                    ))}
                  </select>
                </div>

                {compareItemA && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-950 space-y-3">
                    <div className="h-64 flex items-center justify-center p-2">
                      <img
                        src={compareItemA.fileUrl}
                        alt={compareItemA.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">{compareItemA.id}</span>
                        <span className="text-slate-400">{compareItemA.evidenceType}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{compareItemA.title}</h4>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-mono">
                        <div>Size: {compareItemA.fileSize}</div>
                        <div>Date: {new Date(compareItemA.uploadedAt).toLocaleDateString()}</div>
                        <div className="col-span-2 truncate">Hash: {compareItemA.sha256Hash}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Evidence B */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Evidence File B
                  </span>
                  <select
                    value={compareItemB?.id || ''}
                    onChange={(e) => {
                      const item = infrastructureEvidence.find((ev) => ev.id === e.target.value);
                      if (item) setCompareItemB(item);
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  >
                    {infrastructureEvidence.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.id}: {ev.title}
                      </option>
                    ))}
                  </select>
                </div>

                {compareItemB && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-950 space-y-3">
                    <div className="h-64 flex items-center justify-center p-2">
                      <img
                        src={compareItemB.fileUrl}
                        alt={compareItemB.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">{compareItemB.id}</span>
                        <span className="text-slate-400">{compareItemB.evidenceType}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{compareItemB.title}</h4>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-mono">
                        <div>Size: {compareItemB.fileSize}</div>
                        <div>Date: {new Date(compareItemB.uploadedAt).toLocaleDateString()}</div>
                        <div className="col-span-2 truncate">Hash: {compareItemB.sha256Hash}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Comparative analysis mode does not record punitive defaults without physical committee confirmation.
              </span>
              <button
                onClick={() => setCompareModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UPLOAD INFRASTRUCTURE EVIDENCE                                    */}
      {/* ========================================================================= */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Upload Infrastructure Evidence</span>
              </h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Claimed Facility
                </label>
                <select
                  value={uploadFacilityId}
                  onChange={(e) => setUploadFacilityId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.facilityName} ({f.roomNumber} - {f.buildingBlock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Evidence Category
                  </label>
                  <select
                    value={uploadEvidenceType}
                    onChange={(e) => setUploadEvidenceType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  >
                    <option value="Photograph">Photograph (JPEG/PNG)</option>
                    <option value="Floor Plan / Blueprint">Floor Plan / Blueprint (PDF/SVG)</option>
                    <option value="Statutory Certificate">Statutory Building Certificate</option>
                    <option value="CAD Drawing">CAD As-Built Drawing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Facility Type
                  </label>
                  <select
                    value={uploadFacilityType}
                    onChange={(e) => setUploadFacilityType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  >
                    {FACILITY_TYPES.filter((t) => t !== 'All').map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Evidence Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Level 2 Robotics Lab South-Facing View"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select File (Image / Blueprint / PDF)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                      if (!uploadTitle) setUploadTitle(e.target.files[0].name);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 dark:file:bg-teal-950 dark:file:text-teal-300 hover:file:bg-teal-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUpload}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {isSubmittingUpload ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Ingesting Evidence...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Run AI Scrutiny</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RECORD MISSING EVIDENCE                                           */}
      {/* ========================================================================= */}
      {missingEvidenceModalOpen && selectedFacilityForMissing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-amber-500" />
                <span>Record Missing Statutory Evidence</span>
              </h3>
              <button
                onClick={() => setMissingEvidenceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 block">Facility Name</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedFacilityForMissing.facilityName}
                </span>
                <span className="text-xs text-slate-500 block font-mono">
                  {selectedFacilityForMissing.complianceClause}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Required Statutory Evidence Type
                </label>
                <select
                  value={missingDocType}
                  onChange={(e) => setMissingDocType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                >
                  <option value="Registered Architect Built-up Area Certificate">
                    Registered Architect Built-up Area Certificate (COA Certified)
                  </option>
                  <option value="Municipal Fire CFO Hydraulic Flow & NOC Certificate">
                    Municipal Fire CFO Hydraulic Flow & NOC Certificate
                  </option>
                  <option value="Barrier-Free Ramp Gradient Certification (1:12 slope)">
                    Barrier-Free Ramp Gradient Certification (1:12 slope)
                  </option>
                  <option value="Laboratory Equipment Stock Register & Calibration Log">
                    Laboratory Equipment Stock Register & Calibration Log
                  </option>
                  <option value="CAD As-Built Floor Plan with Dimension Seals">
                    CAD As-Built Floor Plan with Dimension Seals
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Severity Level
                </label>
                <select
                  value={missingSeverity}
                  onChange={(e) => setMissingSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                >
                  <option value="Critical">Critical (Halts Scrutiny Cleared Status)</option>
                  <option value="Major">Major (Deficiency Notice Issued)</option>
                  <option value="Minor">Minor (Rectification within 30 days)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Deficit Notice
                </label>
                <textarea
                  rows={2}
                  value={missingReason}
                  onChange={(e) => setMissingReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recommended Action for Institution
                </label>
                <input
                  type="text"
                  value={missingAction}
                  onChange={(e) => setMissingAction(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => setMissingEvidenceModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMissingEvidence}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                >
                  Record Deficit in Registry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
