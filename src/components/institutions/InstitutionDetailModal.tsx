import React from 'react';
import {
  Award,
  Building,
  Calendar,
  CheckCircle2,
  Compass,
  FileText,
  Mail,
  MapPin,
  Shield,
  User,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';

interface Props {
  institutionId: string;
  onClose: () => void;
}

export const InstitutionDetailModal: React.FC<Props> = ({ institutionId, onClose }) => {
  const { institutions, applications, setSelectedApplicationId, setSelectedInstitutionId, setActiveTab } = useApp();
  const inst = institutions.find((i) => i.id === institutionId);

  if (!inst) return null;

  const instApps = applications.filter((a) => a.pid === inst.pid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in-50">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#071626] to-[#102A43] p-5 sm:p-6 text-white border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-teal-300 font-semibold bg-teal-950 border border-teal-800/80 px-2 py-0.5 rounded">
                  PID: {inst.pid}
                </span>
                <Badge variant={inst.status === 'Compliant' ? 'success' : 'warning'} size="xs">
                  {inst.status}
                </Badge>
                <Badge variant="teal" size="xs">
                  NAAC {inst.naacGrade}
                </Badge>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {inst.name}
              </h2>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                {inst.city}, {inst.state} ({inst.region}) • Estd. {inst.establishedYear}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Compliance Score</span>
              <span className="text-lg font-extrabold text-teal-300">{inst.overallComplianceScore}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">NIRF Ranking Band</span>
              <span className="text-lg font-bold text-white">{inst.nirfBand}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Institution Category</span>
              <span className="text-xs font-semibold text-slate-200 mt-1 block truncate">{inst.category.split('&')[0]}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Contact & Governance Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Institutional Leadership & Communication
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                <span>Head of Institute: <strong>{inst.principalName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-600" />
                <span className="font-mono text-[11px] truncate">{inst.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Approved Intake</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">{inst.approvedIntakeTotal} Seats</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Faculty Strength</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">{inst.totalFacultyCount} Faculty</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Campus Land</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">{inst.totalLandAcres} Acres</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Built-up Area</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">{inst.totalBuiltUpAreaSqM.toLocaleString()} sq.m</span>
            </div>
          </div>

          {/* Active Applications linked to this Institution */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Active Regulatory Scrutiny Dossiers ({instApps.length})
            </h3>
            {instApps.length === 0 ? (
              <div className="p-4 text-center text-slate-500 border border-dashed rounded-xl">
                No active application open for current cycle.
              </div>
            ) : (
              <div className="space-y-2">
                {instApps.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedApplicationId(a.id);
                      setActiveTab('applications');
                      onClose();
                    }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 cursor-pointer transition-colors bg-white dark:bg-slate-850 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                        {a.applicationNumber}
                      </span>
                      <span className="text-slate-500 ml-2">({a.applicationType})</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setSelectedInstitutionId(inst.id);
              setActiveTab('compliance-time-machine');
              onClose();
            }}
            className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Simulate Changes in Time Machine</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-medium text-xs hover:bg-slate-900 transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
