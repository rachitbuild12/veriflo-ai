import React, { useState } from 'react';
import { Building2, Plus, Send, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AICTEJurisdiction, Application, DisciplineCategory, InstitutionType } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NewApplicationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addApplication, addToast } = useApp();

  const [institutionName, setInstitutionName] = useState('');
  const [pid, setPid] = useState('1-' + Math.floor(100000000 + Math.random() * 900000000));
  const [category, setCategory] = useState<DisciplineCategory>('Engineering & Technology');
  const [institutionType, setInstitutionType] = useState<InstitutionType>('Private-Autonomous');
  const [region, setRegion] = useState<AICTEJurisdiction>('Western (WRO)');
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('Pune');
  const [applicationType, setApplicationType] = useState<Application['applicationType']>('Extension of Approval (EoA)');
  const [landArea, setLandArea] = useState(12.5);
  const [builtUpArea, setBuiltUpArea] = useState(38000);
  const [facultyCount, setFacultyCount] = useState(65);
  const [studentStrength, setStudentStrength] = useState(960);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionName.trim()) {
      addToast('error', 'Please enter a valid institution name.');
      return;
    }

    const appNumber = `AICTE-2025-${region.split('(')[1]?.slice(0, 3) || 'RO'}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newApp: Application = {
      id: `APP-NEW-${Date.now()}`,
      applicationNumber: appNumber,
      pid: pid.trim(),
      institutionName: `${institutionName.trim()} [Synthetic]`,
      institutionType,
      category,
      region,
      state: state.trim(),
      city: city.trim(),
      academicYear: '2025-2026',
      applicationType,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'Under AI Scrutiny',
      overallRiskLevel: 'Low',
      deficienciesCount: 0,
      assignedOfficer: 'AICTE Automated Intake Scrutiny',
      currentStage: 'Level 1: AI Scrutiny & OCR',
      lastUpdated: new Date().toISOString().split('T')[0],
      landAreaAcres: Number(landArea),
      builtUpAreaSqM: Number(builtUpArea),
      activeFacultyCount: Number(facultyCount),
      studentStrength: Number(studentStrength),
      programs: [
        {
          id: 'prog-1',
          name: category === 'Management (MBA/PGDM)' ? 'Master of Business Administration' : 'Computer Science & Engineering',
          level: category === 'Management (MBA/PGDM)' ? 'PG' : 'UG',
          intake: 120,
          nbaAccredited: true,
          sanctionedYear: 2010,
        },
        {
          id: 'prog-2',
          name: category === 'Management (MBA/PGDM)' ? 'Executive PGDM' : 'Artificial Intelligence & Machine Learning',
          level: category === 'Management (MBA/PGDM)' ? 'PG' : 'UG',
          intake: 60,
          nbaAccredited: false,
          sanctionedYear: 2023,
        },
      ],
      deficiencyNotices: [],
    };

    addApplication(newApp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in-50">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-teal-700 to-teal-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Building2 className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Register New Institutional Scrutiny Dossier
              </h3>
              <p className="text-xs text-teal-200 font-mono">
                AICTE Approval Process Handbook (APH) 2025-26 Intake Portal
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-teal-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Institution Name *
              </label>
              <input
                required
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="e.g. Sardar Patel Institute of Technology"
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Permanent Institute ID (PID) *
              </label>
              <input
                required
                type="text"
                value={pid}
                onChange={(e) => setPid(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Discipline Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Engineering & Technology">Engineering & Technology</option>
                <option value="Management (MBA/PGDM)">Management (MBA/PGDM)</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Architecture & Planning">Architecture & Planning</option>
                <option value="Polytechnic Diploma">Polytechnic Diploma</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                AICTE Jurisdiction / Regional Office *
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Western (WRO)">Western (WRO)</option>
                <option value="Northern (NRO)">Northern (NRO)</option>
                <option value="Southern (SRO)">Southern (SRO)</option>
                <option value="South-Western (SWRO)">South-Western (SWRO)</option>
                <option value="Central (CRO)">Central (CRO)</option>
                <option value="Eastern (ERO)">Eastern (ERO)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Application Type *
              </label>
              <select
                value={applicationType}
                onChange={(e) => setApplicationType(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
                <option value="Increase in Intake / New Course">Increase in Intake / New Course</option>
                <option value="New Institution Setup">New Institution Setup</option>
                <option value="Introduction of Supernumerary Quota">Introduction of Supernumerary Quota</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                City *
              </label>
              <input
                required
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                State *
              </label>
              <input
                required
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Campus Land (Acres)
              </label>
              <input
                type="number"
                step="0.1"
                value={landArea}
                onChange={(e) => setLandArea(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Total Built-up Area (Sq.M)
              </label>
              <input
                type="number"
                value={builtUpArea}
                onChange={(e) => setBuiltUpArea(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Active Full-Time Faculty
              </label>
              <input
                type="number"
                value={facultyCount}
                onChange={(e) => setFacultyCount(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Total Student Strength
              </label>
              <input
                type="number"
                value={studentStrength}
                onChange={(e) => setStudentStrength(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-900/60 text-[11px] text-teal-800 dark:text-teal-300">
            <strong>Automated Intake:</strong> Upon submission, this dossier will immediately trigger Level 1 AI OCR checks and cadral verification.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for AI Scrutiny</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
