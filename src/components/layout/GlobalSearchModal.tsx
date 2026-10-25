import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  FileSearch,
  FileText,
  Scale,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalSearchModal: React.FC = () => {
  const {
    searchModalOpen,
    setSearchModalOpen,
    applications,
    institutions,
    complianceRules,
    documents,
    blindSpots,
    setActiveTab,
    setSelectedApplicationId,
    setSelectedDocumentId,
    setSelectedInstitutionId,
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [searchModalOpen]);

  if (!searchModalOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchedApps = query
    ? applications.filter(
        (a) =>
          a.applicationNumber.toLowerCase().includes(trimmed) ||
          a.institutionName.toLowerCase().includes(trimmed) ||
          a.pid.includes(trimmed)
      ).slice(0, 4)
    : [];

  const matchedColleges = query
    ? institutions.filter(
        (i) =>
          i.name.toLowerCase().includes(trimmed) ||
          i.city.toLowerCase().includes(trimmed) ||
          i.state.toLowerCase().includes(trimmed) ||
          i.pid.includes(trimmed)
      ).slice(0, 4)
    : [];

  const matchedRules = query
    ? complianceRules.filter(
        (r) =>
          r.clauseCode.toLowerCase().includes(trimmed) ||
          r.title.toLowerCase().includes(trimmed) ||
          r.category.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const matchedDocs = query
    ? documents.filter(
        (d) =>
          d.fileName.toLowerCase().includes(trimmed) ||
          d.documentType.toLowerCase().includes(trimmed) ||
          d.institutionName.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const totalResults = matchedApps.length + matchedColleges.length + matchedRules.length + matchedDocs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-50">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications, institutions, APH rules, documents..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSearchModalOpen(false)}
            className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="text-center py-8 text-xs text-slate-400">
              <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">
                Quick Search Across AICTE Regulatory Repositories
              </p>
              <p>Type an Application Number (e.g., <span className="font-mono text-teal-600 dark:text-teal-400">10928</span>), College Name, or APH Rule code (<span className="font-mono text-teal-600 dark:text-teal-400">APH-FSR</span>).</p>
            </div>
          )}

          {query && totalResults === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              <p className="font-semibold text-slate-600 dark:text-slate-300">No matching regulatory records found</p>
              <p className="mt-1">Try searching for keywords like "Fire NOC", "VJTI", "FSR", or "Land".</p>
            </div>
          )}

          {/* Applications Matches */}
          {matchedApps.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                Applications ({matchedApps.length})
              </h4>
              <div className="space-y-1">
                {matchedApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      setSelectedApplicationId(app.id);
                      setActiveTab('applications');
                      setSearchModalOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {app.institutionName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {app.applicationNumber} • PID: {app.pid} • {app.academicYear}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium shrink-0">
                      {app.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Institutions Matches */}
          {matchedColleges.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-500" />
                Institutions ({matchedColleges.length})
              </h4>
              <div className="space-y-1">
                {matchedColleges.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => {
                      setSelectedInstitutionId(inst.id);
                      setActiveTab('institution-records');
                      setSearchModalOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {inst.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {inst.city}, {inst.state} • PID: {inst.pid} • Score: {inst.overallComplianceScore}%
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium shrink-0">
                      {inst.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Documents Matches */}
          {matchedDocs.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileSearch className="w-3.5 h-3.5 text-purple-500" />
                Dossier Documents ({matchedDocs.length})
              </h4>
              <div className="space-y-1">
                {matchedDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocumentId(doc.id);
                      setActiveTab('document-verification');
                      setSearchModalOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {doc.documentType}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {doc.fileName} • {doc.institutionName}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium shrink-0 border bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      AI Score: {doc.aiConfidenceScore}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Rules Matches */}
          {matchedRules.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-500" />
                Approval Process Handbook Norms ({matchedRules.length})
              </h4>
              <div className="space-y-1">
                {matchedRules.map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => {
                      setActiveTab('compliance-rules');
                      setSearchModalOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        <span className="font-mono text-teal-600 dark:text-teal-400 mr-2">[{rule.clauseCode}]</span>
                        {rule.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {rule.category} • {rule.chapter}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Navigate with mouse or keyboard</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
