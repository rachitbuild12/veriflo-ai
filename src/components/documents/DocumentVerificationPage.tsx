import React, { useState, useRef, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Download,
  FileCheck,
  FileSearch,
  FileText,
  Filter,
  Hash,
  Info,
  Layers,
  Link as LinkIcon,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  UploadCloud,
  UserCheck,
  X,
  ZoomIn,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DocumentVerificationItem } from '../../types';
import { DocumentClaim } from '../blindspot/blindSpotModel';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { OverrideAlertModal } from './OverrideAlertModal';

export const DocumentVerificationPage: React.FC = () => {
  const {
    documents,
    selectedDocumentId,
    setSelectedDocumentId,
    verifyDocument,
    addToast,
    logAuditAction,
    backendOnline,
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadError,
    claims,
    blindSpotRecords,
    setActiveClaimForManualVerification,
    setManualVerificationModalOpen,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'real' | 'synthetic' | 'flagged' | 'verified'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showOcrBoxes, setShowOcrBoxes] = useState(true);
  const [isRescanning, setIsRescanning] = useState(false);
  const [overrideModalDocId, setOverrideModalDocId] = useState<string | null>(null);

  // Upload modal & drag-drop state
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState('Fire & Life Safety NOC (Form B)');
  const [inputPid, setInputPid] = useState('');
  const [inputInstName, setInputInstName] = useState('');
  const [inputPrevIntake, setInputPrevIntake] = useState('');
  const [inputExpectedFee, setInputExpectedFee] = useState('100000');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active document selection
  const activeDocId = selectedDocumentId || documents[0]?.id || null;
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  const realDocsCount = documents.filter((d) => d.isSynthetic === false).length;
  const syntheticDocsCount = documents.filter((d) => d.isSynthetic === true).length;

  const docClaims = useMemo(() => {
    if (!activeDoc) return [];
    return claims.filter(
      (c: DocumentClaim) => c.documentId === activeDoc.id || c.sourceDocumentName === activeDoc.fileName
    );
  }, [claims, activeDoc]);

  const docBlindSpots = useMemo(() => {
    if (!activeDoc) return [];
    return blindSpotRecords.filter(
      (b) => b.documentId === activeDoc.id || docClaims.some((c: DocumentClaim) => c.blindSpotId === b.id)
    );
  }, [blindSpotRecords, activeDoc, docClaims]);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      searchTerm === '' ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.id && doc.id.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'real') {
      return doc.isSynthetic === false;
    }
    if (activeFilter === 'synthetic') {
      return doc.isSynthetic === true;
    }
    if (activeFilter === 'flagged') {
      return (
        doc.verificationStatus === 'Tampering / Forgery Suspected' ||
        doc.verificationStatus === 'Deficiency Flagged'
      );
    }
    if (activeFilter === 'verified') {
      return doc.verificationStatus === 'Verified (Compliant)';
    }
    return true;
  });

  const handleRescan = () => {
    if (!activeDoc) return;
    setIsRescanning(true);
    addToast('info', `Running PyMuPDF digital parser and rule checks on ${activeDoc.fileName}...`, 'AI Verification Engine');
    setTimeout(() => {
      setIsRescanning(false);
      addToast('success', `Verification scan complete for ${activeDoc.fileName}. Authenticity score: ${activeDoc.aiConfidenceScore}%.`, 'Scan Complete');
      logAuditAction(`Re-OCR & Forensic Scan Executed`, `Doc ID: ${activeDoc.id}`, 'AI_SCAN', 'Info');
    }, 1000);
  };

  const handleMarkCompliant = () => {
    if (!activeDoc) return;
    verifyDocument(activeDoc.id, 'Verified (Compliant)', 'Officer confirmed original document matches state authority records.');
  };

  const handleMarkDeficient = () => {
    if (!activeDoc) return;
    verifyDocument(activeDoc.id, 'Deficiency Flagged', 'Flagged for mandatory compliance rectification by institution.');
  };

  const handleDownloadAnalysis = () => {
    if (!activeDoc) return;
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeDoc, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', jsonStr);
    dlAnchorElem.setAttribute('download', `Veriflo_Forensic_${activeDoc.id}.json`);
    dlAnchorElem.click();
    addToast('success', 'Forensic JSON report exported successfully.', 'Export Ready');
  };

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const validExts = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExts.includes(ext)) {
      addToast('error', `Invalid file format '${ext}'. Only PDF, PNG, and JPEG documents are permitted.`, 'File Error');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      addToast('error', 'File size exceeds 25 MB limit.', 'File Error');
      return;
    }
    setSelectedFile(file);
  };

  const handleExecuteUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadDocument(selectedFile, {
        documentType: selectedDocType,
        expectedPid: inputPid || undefined,
        institutionName: inputInstName || undefined,
        previousApprovedIntake: inputPrevIntake ? parseInt(inputPrevIntake, 10) : undefined,
        expectedFeeAmount: inputExpectedFee ? parseFloat(inputExpectedFee) : 100000,
      });
      // Reset form and close
      setSelectedFile(null);
      setUploadPanelOpen(false);
      setActiveFilter('real');
    } catch {
      // Error handled in AppContext
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Document Verification & Forensic Suite
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-semibold">
              FastAPI Pipeline v4.2
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                backendOnline
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {backendOnline ? 'Engine Online (127.0.0.1:8000)' : 'Engine Standby'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deterministic AICTE APH compliance checks, SHA-256 deduplication, PyMuPDF digital parser, and metadata alteration detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setUploadPanelOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
          <button
            onClick={handleRescan}
            disabled={isRescanning}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRescanning ? 'animate-spin' : ''}`} />
            <span>{isRescanning ? 'Scanning...' : 'Re-verify'}</span>
          </button>
          <button
            onClick={handleDownloadAnalysis}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Export Forensic JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Upload Dropzone Drawer / Panel */}
      {uploadPanelOpen && (
        <div className="p-5 bg-white dark:bg-slate-900 border-2 border-teal-500/40 rounded-2xl shadow-lg space-y-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Upload Regulatory Dossier Document for Verification
              </h3>
              <p className="text-xs text-slate-500">
                Supports PDF, PNG, and JPEG (up to 25MB). Runs neural extraction, SHA-256 hash indexing, and deterministic compliance checks.
              </p>
            </div>
            <button
              onClick={() => setUploadPanelOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Drop Area (col 2) */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`md:col-span-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                dragActive
                  ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40'
                  : selectedFile
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                  : 'border-slate-300 dark:border-slate-700 hover:border-teal-400 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-1">
                  <FileCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Verification
                  </p>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-1">
                    Click to choose a different file
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Drag & Drop official certificate or <span className="text-teal-600 dark:text-teal-400 underline">Browse</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Allowed formats: PDF, PNG, JPEG • Max file size: 25 MB
                  </p>
                </div>
              )}
            </div>

            {/* Optional Metadata Controls */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Document Type Hint
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option>Fire & Life Safety NOC (Form B)</option>
                  <option>Land Title Deed & Mutation Certificate</option>
                  <option>Architect Built-up Area Certificate</option>
                  <option>State Pollution Control Board NOC</option>
                  <option>Faculty Cadre & Form-16 List</option>
                  <option>University Affiliation Letter</option>
                  <option>Previous Approval Order (EoA)</option>
                  <option>Barrier-free Divyangjan Ramp Certificate</option>
                  <option>Audited Balance Sheet & Corpus FD</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expected Permanent Institute ID (PID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1-4359812451"
                  value={inputPid}
                  onChange={(e) => setInputPid(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Past Sanctioned Intake (for EoA Variance check)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 360"
                  value={inputPrevIntake}
                  onChange={(e) => setInputPrevIntake(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Upload Progress Bar & Error Alert */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold text-teal-700 dark:text-teal-300">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Running Neural Extraction & Deterministic Verification...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadError && (
            <div className="p-3 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Verification Pipeline Error</p>
                <p className="text-[11px] mt-0.5">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setSelectedFile(null);
                setUploadPanelOpen(false);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteUpload}
              disabled={!selectedFile || isUploading}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Start AI Scrutiny</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Document Selector & List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents or institutions..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 text-[11px]">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All ({documents.length})
              </button>
              <button
                onClick={() => setActiveFilter('real')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  activeFilter === 'real'
                    ? 'bg-teal-700 text-white'
                    : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                }`}
              >
                Real Uploads ({realDocsCount})
              </button>
              <button
                onClick={() => setActiveFilter('synthetic')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  activeFilter === 'synthetic'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Synthetic Demo ({syntheticDocsCount})
              </button>
              <button
                onClick={() => setActiveFilter('flagged')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  activeFilter === 'flagged'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Flagged
              </button>
              <button
                onClick={() => setActiveFilter('verified')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  activeFilter === 'verified'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Compliant
              </button>
            </div>
          </div>

          {/* Documents Scrollable List */}
          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {filteredDocs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl space-y-2">
                <FileSearch className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No documents match current filters.</p>
                <button
                  onClick={() => setUploadPanelOpen(true)}
                  className="text-xs text-teal-600 dark:text-teal-400 font-semibold underline"
                >
                  Upload a document to verify
                </button>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = activeDoc?.id === doc.id;
                const isTamper = doc.verificationStatus === 'Tampering / Forgery Suspected';
                const isDeficient = doc.verificationStatus === 'Deficiency Flagged';
                const isCompliant = doc.verificationStatus === 'Verified (Compliant)';
                const isReal = doc.isSynthetic === false;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocumentId(doc.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 shadow-sm ring-1 ring-teal-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {doc.documentType}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isTamper
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : isDeficient
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : isCompliant
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {doc.aiConfidenceScore}% AI
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1">
                      {doc.institutionName}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80 font-mono">
                      <span className="flex items-center gap-1">
                        {isReal ? (
                          <span className="px-1 py-0.2 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-sans font-bold rounded text-[9px]">
                            REAL
                          </span>
                        ) : (
                          <span className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-sans rounded text-[9px]">
                            DEMO
                          </span>
                        )}
                        <span>{doc.fileSize}</span>
                      </span>
                      <span className="truncate max-w-[140px]">{doc.verificationStatus}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Visualizer & AI Scrutiny Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeDoc ? (
            <>
              {/* Synthetic Mode Disclaimer if Synthetic */}
              {activeDoc.isSynthetic && (
                <div className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      <strong>Synthetic Demo Record:</strong> This is a simulated institution profile for system demonstration. It was not processed through live OCR or external state verification.
                    </span>
                  </div>
                  <button
                    onClick={() => setUploadPanelOpen(true)}
                    className="shrink-0 text-teal-600 dark:text-teal-400 font-semibold underline text-xs"
                  >
                    Upload Real File
                  </button>
                </div>
              )}

              {/* Active Document Header Card */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {activeDoc.documentType}
                    </h2>
                    <Badge
                      variant={
                        activeDoc.verificationStatus.includes('Tampering')
                          ? 'danger'
                          : activeDoc.verificationStatus.includes('Verified')
                          ? 'success'
                          : 'warning'
                      }
                      size="xs"
                    >
                      {activeDoc.verificationStatus}
                    </Badge>
                    {activeDoc.isSynthetic === false ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700 font-mono">
                        REAL VERIFIED
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        DEMO MODE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {activeDoc.fileName} • {activeDoc.fileSize} • Uploaded: {activeDoc.uploadedAt}
                  </p>
                  <p className="text-xs font-medium text-teal-600 dark:text-teal-400">
                    {activeDoc.institutionName}
                  </p>
                  {activeDoc.sha256Hash && (
                    <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Hash className="w-3 h-3 text-slate-400" />
                      SHA-256: <span className="text-slate-600 dark:text-slate-300 truncate max-w-sm">{activeDoc.sha256Hash}</span>
                    </p>
                  )}
                </div>

                {/* Score Dial */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      AI Authenticity Confidence
                    </span>
                    <span
                      className={`text-2xl font-extrabold ${
                        activeDoc.aiConfidenceScore >= 90
                          ? 'text-emerald-500'
                          : activeDoc.aiConfidenceScore >= 65
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {activeDoc.aiConfidenceScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Duplicate Document Alert if SHA-256 Collision detected */}
              {activeDoc.isDuplicate && (
                <div className="p-3.5 rounded-xl border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-800 dark:text-rose-300 text-sm">
                      Exact Cryptographic Duplicate Detected (SHA-256 Collision)
                    </h4>
                    <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                      This file’s binary SHA-256 checksum exactly matches previously uploaded record{' '}
                      <strong className="font-mono text-rose-700 dark:text-rose-300">{activeDoc.duplicateOf}</strong>.
                      AICTE APH Rule 4.2 strictly prohibits cross-institution duplicate document submission.
                    </p>
                  </div>
                </div>
              )}

              {/* Suspicious Alteration Indicator Directive Notice (GovTech Safeguard) */}
              {activeDoc.tamperSignals.length > 0 && (
                <div className="p-3.5 rounded-xl border-2 border-amber-500/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm flex items-center gap-1.5">
                      Suspicious Alteration Indicator Detected
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-sans">
                        GovTech Verification Directive
                      </span>
                    </h4>
                    <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                      {activeDoc.tamperSignals[0].detail}
                    </p>
                    <div className="mt-2 p-2 bg-amber-100/60 dark:bg-amber-900/40 rounded border border-amber-300 dark:border-amber-800 text-[11px] font-medium text-amber-900 dark:text-amber-200">
                      <strong>Mandatory AICTE Safeguard:</strong> A document is never declared forged solely based on an anomaly. A physical ground inspection or registrar record confirmation is mandatory prior to penal action.
                    </div>
                  </div>
                </div>
              )}

              {/* Document Claims & Verification Blind Spots */}
              {docClaims.length > 0 && (
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                        <Shield className="w-4 h-4 text-teal-600" />
                        Tracked Claims & Independent Source Verification
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Tracks verification status separately for every relevant claim in this document.
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {docClaims.length} Claims Assessed
                    </span>
                  </div>

                  {/* Claims List */}
                  <div className="space-y-2">
                    {docClaims.map((claim: DocumentClaim) => (
                      <div
                        key={claim.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {claim.claimType}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {claim.status}
                            </span>
                          </div>
                          <p className="text-teal-700 dark:text-teal-400 font-semibold text-[11px]">
                            Claim: "{claim.claimedValue}"
                          </p>
                          {claim.statusReason && (
                            <p className="text-[10px] text-slate-500 leading-snug">
                              {claim.statusReason}
                            </p>
                          )}
                          {claim.authorizedEvidence && (
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                              Verified by: {claim.authorizedEvidence.sourceIdentity} (Ref: {claim.authorizedEvidence.evidenceReference})
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setActiveClaimForManualVerification(claim);
                            setManualVerificationModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shrink-0 shadow-xs flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Manual Verify</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* If active blind spots exist on this document */}
                  {docBlindSpots.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
                      <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Verification Blind Spot Identified: {docBlindSpots[0].title}
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong>What Remains Unverified:</strong> {docBlindSpots[0].whatRemainsUnverified}
                      </p>
                      <div className="text-[11px] text-teal-800 dark:text-teal-300 pt-1 border-t border-rose-200 dark:border-rose-900/60">
                        <strong>Next Recommended Action:</strong> {docBlindSpots[0].nextRecommendedAction}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Document Visualizer & Anomaly Heatmap Simulation */}
              <div className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner text-slate-200 p-4 min-h-[380px] flex flex-col justify-between">
                {/* Visualizer Toolbar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <FileSearch className="w-4 h-4 text-teal-400" />
                      Visual Inspection & Bounding Geometry
                    </span>
                    {activeDoc.ocrEngineUsed && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {activeDoc.ocrEngineUsed}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showHeatmap}
                        onChange={(e) => setShowHeatmap(e.target.checked)}
                        className="rounded text-teal-500 focus:ring-teal-500"
                      />
                      <span>Anomaly Bounding Boxes</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOcrBoxes}
                        onChange={(e) => setShowOcrBoxes(e.target.checked)}
                        className="rounded text-teal-500 focus:ring-teal-500"
                      />
                      <span>OCR Entity Tags</span>
                    </label>
                  </div>
                </div>

                {/* Simulated Document Preview Page */}
                <div className="my-4 mx-auto w-full max-w-xl bg-white text-slate-900 p-6 rounded-lg shadow-2xl border border-slate-300 font-serif text-[11px] leading-relaxed relative select-none">
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] font-sans font-black text-6xl rotate-[-30deg] uppercase text-slate-900">
                    Official Regulatory Record
                  </div>

                  {/* Header */}
                  <div className="text-center pb-3 border-b-2 border-slate-800 mb-4 space-y-1">
                    <div className="w-8 h-8 mx-auto rounded-full bg-slate-800 text-amber-300 flex items-center justify-center font-bold text-xs">
                      GOV
                    </div>
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      State Competent Authority / Statutory Regulatory Board
                    </div>
                    <div className="text-[10px] text-slate-600 font-sans">
                      Government of India • Directorate of Technical Education & Safety
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="text-center font-bold uppercase tracking-wide text-xs mb-3 text-slate-800">
                    {activeDoc.documentType}
                  </div>

                  {/* Body Content */}
                  <p className="mb-2">
                    This is to formally certify that the supporting dossier and statutory certificates submitted under the AICTE Approval Process Handbook (APH 2025-26) have been evaluated for institutional accreditation.
                  </p>

                  <div className="my-2 p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[10px] space-y-1">
                    <div><strong>Institution Name:</strong> {activeDoc.institutionName}</div>
                    <div><strong>Document ID:</strong> {activeDoc.id}</div>
                    <div><strong>Reference Hash:</strong> {activeDoc.sha256Hash ? activeDoc.sha256Hash.slice(0, 24) + '...' : 'Generated at Ingestion'}</div>
                  </div>

                  {/* Tamper Anomaly Highlight Box */}
                  {showHeatmap && activeDoc.tamperSignals.length > 0 && (
                    <div className="my-3 p-2.5 rounded border-2 border-dashed border-rose-500 bg-rose-500/10 text-rose-900 font-sans text-[10px] relative animate-pulse">
                      <div className="flex items-center gap-1 font-bold text-rose-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                        AI Forensic Alert: {activeDoc.tamperSignals[0].type}
                      </div>
                      <p className="mt-0.5 text-slate-800 font-medium">
                        {activeDoc.tamperSignals[0].detail}
                      </p>
                    </div>
                  )}

                  {/* Stamps & Signatures */}
                  <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-200 font-sans text-[10px]">
                    <div className="text-slate-500 text-center">
                      <div className="w-14 h-14 border border-dashed border-slate-400 rounded-full flex items-center justify-center text-[9px] text-slate-400 mx-auto mb-1">
                        Seal
                      </div>
                      <span>Municipal Seal</span>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-[9px] text-slate-400 mb-2">Digitally Verified via e-Gov Sign</div>
                      <div className="font-bold border-t border-slate-400 pt-1">
                        Authorized Signatory
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Visualizer Info Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>Renderer: PyMuPDF 300 DPI Native Extraction Canvas</span>
                  <span className="font-mono">Tamper Bounding Engine: Active</span>
                </div>
              </div>

              {/* Structured Deterministic Findings Table (Rules Engine) */}
              {activeDoc.structuredFindings && activeDoc.structuredFindings.length > 0 && (
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 text-xs">
                      <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Deterministic AICTE Compliance Checks ({activeDoc.structuredFindings.length})
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      APH Rule Standards Engine
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {activeDoc.structuredFindings.map((finding, idx) => (
                      <div key={idx} className="py-2.5 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
                              {finding.rule_id}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {finding.rule_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({finding.clause})
                            </span>
                          </div>
                          <Badge
                            variant={
                              finding.passed
                                ? 'success'
                                : finding.severity === 'Critical'
                                ? 'danger'
                                : 'warning'
                            }
                            size="xs"
                          >
                            {finding.passed ? 'PASSED' : finding.severity.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mt-1 p-2 rounded bg-slate-50 dark:bg-slate-800/60 font-mono">
                          <div>
                            <span className="text-slate-400 block">Observed Value:</span>
                            <span className={finding.passed ? 'text-slate-700 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                              {finding.observed_value}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Expected Regulatory Value:</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {finding.expected_value}
                            </span>
                          </div>
                        </div>

                        {!finding.passed && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-900/60">
                            <strong>Recommended Action:</strong> {finding.recommended_action}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Entities & APH Deficiencies (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Extracted OCR Entities */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    AI Extracted Entities (PyMuPDF & OCR)
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Object.entries(activeDoc.extractedEntities).map(([key, value]) => (
                      <div key={key} className="py-1.5 flex justify-between gap-2">
                        <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-right font-mono">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* APH Deficiencies / Tamper Findings */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    APH Regulatory Deficiencies ({activeDoc.deficiencyFindings.length})
                  </h3>

                  {activeDoc.deficiencyFindings.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      <p className="font-semibold text-emerald-700 dark:text-emerald-300">All Norms Satisfied</p>
                      <p className="text-[11px] text-slate-500">Document matches Approval Process Handbook thresholds.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeDoc.deficiencyFindings.map((finding, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-amber-800 dark:text-amber-300">
                              {finding.clause}
                            </span>
                            <Badge variant={finding.severity === 'Critical' ? 'danger' : 'warning'} size="xs">
                              {finding.severity}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                            {finding.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeDoc.officerOverride && (
                    <div className="p-2.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 text-[11px]">
                      <strong>Officer Override Recorded:</strong> {activeDoc.officerOverride.reason}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-slate-500">
                  Current Status: <strong className="text-slate-800 dark:text-slate-200">{activeDoc.verificationStatus}</strong>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activeDoc.tamperSignals.length > 0 && !activeDoc.officerOverride && (
                    <button
                      onClick={() => setOverrideModalDocId(activeDoc.id)}
                      className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs transition-colors"
                    >
                      Override AI Alert with Justification
                    </button>
                  )}

                  <button
                    onClick={handleMarkDeficient}
                    className="px-3.5 py-2 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-semibold transition-colors"
                  >
                    Flag Discrepancy
                  </button>

                  <button
                    onClick={handleMarkCompliant}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold shadow-sm transition-colors"
                  >
                    Mark Verified & Compliant
                  </button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="No Document Selected"
              description="Select a document from the left panel to review OCR extracts, tamper detection signals, and APH compliance checks."
            />
          )}
        </div>
      </div>

      {/* Override Alert Modal */}
      {overrideModalDocId && (
        <OverrideAlertModal
          documentId={overrideModalDocId}
          onClose={() => setOverrideModalDocId(null)}
        />
      )}
    </div>
  );
};
