import React, { useMemo, useState } from 'react';
import {
  Award,
  Building,
  Building2,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileCheck2,
  Filter,
  GraduationCap,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InstitutionRecord } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { InstitutionDetailModal } from './InstitutionDetailModal';

export const InstitutionRecordsPage: React.FC = () => {
  const { institutions, selectedInstitutionId, setSelectedInstitutionId, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredInstitutions = useMemo(() => {
    return institutions.filter((inst) => {
      const matchesSearch =
        searchTerm === '' ||
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.pid.includes(searchTerm) ||
        inst.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.principalName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesState = selectedState === 'all' || inst.state === selectedState;
      const matchesType = selectedType === 'all' || inst.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || inst.status === selectedStatus;

      return matchesSearch && matchesState && matchesType && matchesStatus;
    });
  }, [institutions, searchTerm, selectedState, selectedType, selectedStatus]);

  const paginatedInstitutions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInstitutions.slice(start, start + itemsPerPage);
  }, [filteredInstitutions, currentPage, itemsPerPage]);

  const states = Array.from(new Set(institutions.map((i) => i.state))).sort();

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "PID,Institution Name,Type,Category,City,State,NAAC,Compliance Score,Status\n" +
      filteredInstitutions.map(i => `"${i.pid}","${i.name}","${i.type}","${i.category}","${i.city}","${i.state}","${i.naacGrade}",${i.overallComplianceScore},"${i.status}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AICTE_Institutions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Institution records exported as CSV.', 'Export Complete');
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            AICTE Approved Technical Institutions Directory
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
              National Register
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Master records of accredited universities, colleges, and polytechnics under AICTE regulatory purview.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Directory</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              placeholder="Search by college, PID, city..."
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

          {/* State Dropdown */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All States</option>
              {states.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Type Dropdown */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Management Types</option>
              <option value="Government">Government</option>
              <option value="Govt-Aided">Govt-Aided</option>
              <option value="Private-Autonomous">Private-Autonomous</option>
              <option value="Self-Financing">Self-Financing</option>
              <option value="Deemed to be University">Deemed to be University</option>
            </select>
          </div>

          {/* Compliance Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Compliance Statuses</option>
              <option value="Compliant">Compliant</option>
              <option value="Deficiencies Outstanding">Deficiencies Outstanding</option>
              <option value="Notice Issued">Notice Issued</option>
              <option value="Under Inspection">Under Inspection</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {paginatedInstitutions.length === 0 ? (
          <EmptyState
            title="No Institutions Found"
            description="Adjust your search criteria to locate colleges in the National Register."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">PID</th>
                  <th className="py-3 px-4">Institution Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">NAAC</th>
                  <th className="py-3 px-4 text-center">Compliance Rating</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedInstitutions.map((inst) => (
                  <tr
                    key={inst.id}
                    onClick={() => setSelectedInstitutionId(inst.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                      {inst.pid}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-sm">
                      <div className="truncate">{inst.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        Estd. {inst.establishedYear} • {inst.category}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {inst.type}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {inst.city}, {inst.state}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge variant="teal" size="xs">
                        {inst.naacGrade}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 font-bold">
                        <span
                          className={`${
                            inst.overallComplianceScore >= 90
                              ? 'text-emerald-500'
                              : inst.overallComplianceScore >= 75
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          }`}
                        >
                          {inst.overallComplianceScore}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant={inst.status === 'Compliant' ? 'success' : 'warning'}
                        size="xs"
                      >
                        {inst.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedInstitutionId(inst.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors"
                      >
                        View Dossier
                      </button>
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
          totalItems={filteredInstitutions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newCount) => {
            setItemsPerPage(newCount);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Institution Detail Modal */}
      {selectedInstitutionId && (
        <InstitutionDetailModal
          institutionId={selectedInstitutionId}
          onClose={() => setSelectedInstitutionId(null)}
        />
      )}
    </div>
  );
};
