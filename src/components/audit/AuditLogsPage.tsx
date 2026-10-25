import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Filter,
  History,
  Key,
  Lock,
  Search,
  Shield,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditLogItem } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        searchTerm === '' ||
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.includes(searchTerm);

      const matchesCategory =
        selectedCategory === 'all' || log.category === selectedCategory;

      const matchesSeverity =
        selectedSeverity === 'all' || log.severity === selectedSeverity;

      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [auditLogs, searchTerm, selectedCategory, selectedSeverity]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleExportAuditCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Timestamp,Actor,Role,IP Address,Action,Target Entity,Category,Severity,SHA-256 Hash\n" +
      filteredLogs.map(l => `"${l.timestamp}","${l.actor}","${l.role}","${l.ipAddress}","${l.action}","${l.targetEntity}","${l.category}","${l.severity}","${l.hash}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AICTE_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Cryptographic audit trail exported as CSV.', 'Export Complete');
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Regulatory Scrutiny Audit Trail
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
              Tamper-Evident Ledger
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographic non-repudiation ledger recording AI anomaly detections, officer overrides, and statutory orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>SHA-256 Ledger Verified</span>
          </div>

          <button
            onClick={handleExportAuditCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by actor, action, target, or hash..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Action Categories</option>
              <option value="AI_SCAN">AI Forensic Scan (AI_SCAN)</option>
              <option value="OFFICER_OVERRIDE">Officer Overrides (OFFICER_OVERRIDE)</option>
              <option value="STATUS_CHANGE">Workflow Updates (STATUS_CHANGE)</option>
              <option value="DEFICIENCY_NOTICE">Deficiency Notices (DEFICIENCY_NOTICE)</option>
              <option value="RULE_UPDATE">Rule Amendments (RULE_UPDATE)</option>
              <option value="EOA_GENERATION">Approval Orders (EOA_GENERATION)</option>
            </select>
          </div>

          {/* Severity Dropdown */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Severities</option>
              <option value="Info">Info Level</option>
              <option value="Warning">Warning Level</option>
              <option value="Critical">Critical Severity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {paginatedLogs.length === 0 ? (
          <EmptyState
            title="No Matching Audit Logs Found"
            description="Clear search filters to see all recorded regulatory transactions."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Actor / Digital Identity</th>
                  <th className="py-3 px-4">Regulatory Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4 font-mono">Cryptographic Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {log.timestamp}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-sans font-semibold text-slate-900 dark:text-white">
                        {log.actor}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.role} • {log.ipAddress}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-sans font-medium text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>

                    <td className="py-3 px-4 font-sans text-teal-600 dark:text-teal-400 max-w-xs truncate">
                      {log.targetEntity}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                        {log.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant={log.severity === 'Critical' ? 'danger' : log.severity === 'Warning' ? 'warning' : 'slate'}
                        size="xs"
                      >
                        {log.severity}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px] truncate max-w-[130px]" title={log.hash}>
                      {log.hash.slice(0, 16)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalItems={filteredLogs.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newCount) => {
            setItemsPerPage(newCount);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};
