import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  PlusCircle,
  Printer,
  Search,
  Shield,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VerificationReport } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { GenerateReportModal } from './GenerateReportModal';
import { ReportViewerModal } from './ReportViewerModal';

export const VerificationReportsPage: React.FC = () => {
  const {
    verificationReports,
    selectedReportId,
    setSelectedReportId,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  const filteredReports = useMemo(() => {
    return verificationReports.filter((report) => {
      const matchesSearch =
        searchTerm === '' ||
        report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.pid.includes(searchTerm) ||
        report.evaluatorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        selectedType === 'all' || report.reportType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [verificationReports, searchTerm, selectedType]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Regulatory Verification Reports & EoA Orders
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
              {verificationReports.length} Dispatched
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographically sealed Deficiency Reports, Scrutiny Committee Minutes, and final Extension of Approval (EoA) letters.
          </p>
        </div>

        <button
          onClick={() => setGenerateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Generate Scrutiny Report</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by report no, college, or evaluator..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full sm:w-auto py-2 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Report Types</option>
            <option value="Final Extension of Approval (EoA) Order">Extension of Approval (EoA)</option>
            <option value="Deficiency Assessment Report">Deficiency Assessment Report</option>
            <option value="Expert Visit Committee (EVC) Findings">EVC Inspection Findings</option>
            <option value="Scrutiny Committee Summary">Scrutiny Committee Summary</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            onClick={() => setSelectedReportId(report.id)}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/80 rounded-2xl shadow-sm transition-all cursor-pointer space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                  {report.reportNumber}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {report.institutionName}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  PID: {report.pid} • Date: {report.generatedDate}
                </p>
              </div>

              <Badge
                variant={
                  report.verdict.includes('Approval')
                    ? 'success'
                    : report.verdict.includes('15-day')
                    ? 'warning'
                    : 'danger'
                }
                size="xs"
              >
                {report.verdict}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Norms Audited</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{report.summaryMetrics.totalNormsChecked}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Satisfied</span>
                <span className="font-bold text-emerald-600">{report.summaryMetrics.normsSatisfied}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Deficits</span>
                <span className="font-bold text-rose-600">{report.summaryMetrics.criticalViolations + report.summaryMetrics.minorDeficiencies}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              <span>Signatory: <strong>{report.evaluatorName}</strong></span>
              <span className="text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                View Official Order
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Report Viewer Modal */}
      {selectedReportId && (
        <ReportViewerModal
          reportId={selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}

      {/* Generate Report Modal */}
      <GenerateReportModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
      />
    </div>
  );
};
