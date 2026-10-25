import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  Building,
  CheckCircle,
  ChevronDown,
  Download,
  Eye,
  FilePlus,
  FileText,
  Filter,
  PlusCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  AICTEJurisdiction,
  Application,
  ApplicationStatus,
  DisciplineCategory,
  RiskLevel,
} from '../../types';
import { Badge, RiskBadge, StatusBadge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { ApplicationDetailModal } from './ApplicationDetailModal';
import { DeficiencyNoticeModal } from './DeficiencyNoticeModal';
import { NewApplicationModal } from './NewApplicationModal';

export const ApplicationsPage: React.FC = () => {
  const {
    applications,
    selectedApplicationId,
    setSelectedApplicationId,
    newAppModalOpen,
    setNewAppModalOpen,
    addToast,
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'deficiencies' | 'risk' | 'name'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [deficiencyModalAppId, setDeficiencyModalAppId] = useState<string | null>(null);

  // Filter & Sort Logic
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        searchTerm === '' ||
        app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.pid.includes(searchTerm) ||
        app.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRegion =
        selectedRegion === 'all' || app.region === selectedRegion;

      const matchesStatus =
        selectedStatus === 'all' || app.status === selectedStatus;

      const matchesRisk =
        selectedRisk === 'all' || app.overallRiskLevel === selectedRisk;

      const matchesCategory =
        selectedCategory === 'all' || app.category === selectedCategory;

      return (
        matchesSearch &&
        matchesRegion &&
        matchesStatus &&
        matchesRisk &&
        matchesCategory
      );
    });
  }, [
    applications,
    searchTerm,
    selectedRegion,
    selectedStatus,
    selectedRisk,
    selectedCategory,
  ]);

  const sortedApplications = useMemo(() => {
    return [...filteredApplications].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
      } else if (sortBy === 'deficiencies') {
        comparison = b.deficienciesCount - a.deficienciesCount;
      } else if (sortBy === 'name') {
        comparison = a.institutionName.localeCompare(b.institutionName);
      } else if (sortBy === 'risk') {
        const riskWeights: Record<RiskLevel, number> = { Severe: 4, High: 3, Medium: 2, Low: 1 };
        comparison = riskWeights[b.overallRiskLevel] - riskWeights[a.overallRiskLevel];
      }
      return sortDirection === 'asc' ? -comparison : comparison;
    });
  }, [filteredApplications, sortBy, sortDirection]);

  // Paginated items
  const paginatedApps = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedApplications.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedApplications, currentPage, itemsPerPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedRegion('all');
    setSelectedStatus('all');
    setSelectedRisk('all');
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Application No,Institution Name,PID,Category,Region,Status,Risk Level,Deficiencies,Submitted Date\n" +
      sortedApplications.map(a => `"${a.applicationNumber}","${a.institutionName}","${a.pid}","${a.category}","${a.region}","${a.status}","${a.overallRiskLevel}",${a.deficienciesCount},"${a.submittedDate}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AICTE_Applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Filtered applications exported as CSV.', 'Export Complete');
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Institutional Applications Directory
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
              {applications.length} Records
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage institutional Extension of Approval (EoA), course expansions, and compliance scrutiny.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setNewAppModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Application</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by App ID, Institute, PID, City..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Region Dropdown */}
          <div>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Regional Zones</option>
              <option value="Western (WRO)">Western (WRO)</option>
              <option value="Northern (NRO)">Northern (NRO)</option>
              <option value="Southern (SRO)">Southern (SRO)</option>
              <option value="South-Western (SWRO)">South-Western (SWRO)</option>
              <option value="Central (CRO)">Central (CRO)</option>
              <option value="Eastern (ERO)">Eastern (ERO)</option>
              <option value="North-Western (NWRO)">North-Western (NWRO)</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Scrutiny Statuses</option>
              <option value="Under AI Scrutiny">Under AI Scrutiny</option>
              <option value="Level 2: Scrutiny Committee">Level 2 Committee</option>
              <option value="Deficiencies Communicated">Deficiencies Communicated</option>
              <option value="Hearing / Appellate">Hearing / Appellate (SAC)</option>
              <option value="EVC Physical Inspection">EVC Physical Inspection</option>
              <option value="Approved / EoA Issued">Approved / EoA Issued</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Risk Level Dropdown */}
          <div>
            <select
              value={selectedRisk}
              onChange={(e) => {
                setSelectedRisk(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
              <option value="Severe">Severe Risk</option>
            </select>
          </div>
        </div>

        {/* Secondary controls: Active Filters summary & sorting */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort by:</span>
            <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
              <button
                onClick={() => setSortBy('date')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  sortBy === 'date'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy('risk')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  sortBy === 'risk'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Risk
              </button>
              <button
                onClick={() => setSortBy('deficiencies')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  sortBy === 'deficiencies'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Deficiencies
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  sortBy === 'name'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Name
              </button>
            </div>

            <button
              onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="p-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              title={`Sort ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {(searchTerm || selectedRegion !== 'all' || selectedStatus !== 'all' || selectedRisk !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
            >
              <X className="w-3.5 h-3.5" />
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {paginatedApps.length === 0 ? (
          <EmptyState
            title="No Applications Match Current Criteria"
            description="Try modifying search keywords or resetting filter parameters to view active regulatory applications."
            actionText="Reset Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Application No.</th>
                  <th className="py-3 px-4">Institution Name & PID</th>
                  <th className="py-3 px-4">Zone / State</th>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Scrutiny Status</th>
                  <th className="py-3 px-4 text-center">Deficiencies</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApplicationId(app.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                      {app.applicationNumber}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {app.institutionName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        PID: {app.pid} • {app.institutionType}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        {app.city}, {app.state}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {app.region.split('(')[0].trim()}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {app.category.split('&')[0].trim()}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <RiskBadge risk={app.overallRiskLevel} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={app.status} />
                    </td>

                    <td className="py-3 px-4 text-center">
                      {app.deficienciesCount > 0 ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          {app.deficienciesCount} Clause{app.deficienciesCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-semibold text-[11px] flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          0 (Nil)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedApplicationId(app.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="View Full Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeficiencyModalAppId(app.id)}
                          className="px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-medium text-[11px]"
                          title="Issue Deficiency Notice"
                        >
                          Notice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredApplications.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newCount) => {
            setItemsPerPage(newCount);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Application Detail Modal */}
      {selectedApplicationId && (
        <ApplicationDetailModal
          applicationId={selectedApplicationId}
          onClose={() => setSelectedApplicationId(null)}
          onIssueDeficiency={() => {
            setDeficiencyModalAppId(selectedApplicationId);
          }}
        />
      )}

      {/* Deficiency Notice Modal */}
      {deficiencyModalAppId && (
        <DeficiencyNoticeModal
          applicationId={deficiencyModalAppId}
          onClose={() => setDeficiencyModalAppId(null)}
        />
      )}

      {/* New Application Submission Modal */}
      <NewApplicationModal
        isOpen={newAppModalOpen}
        onClose={() => setNewAppModalOpen(false)}
      />
    </div>
  );
};
