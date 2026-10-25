import React, { useState } from 'react';
import { Calculator, CheckCircle2, GraduationCap, Info, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CadreRatioCalculatorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [totalStudents, setTotalStudents] = useState<number>(720);
  const [accreditationTier, setAccreditationTier] = useState<'tier1' | 'tier2'>('tier1');
  const [discipline, setDiscipline] = useState<'engineering' | 'management' | 'pharmacy'>('engineering');

  if (!isOpen) return null;

  // AICTE Norm calculations:
  // Engineering Tier 1: FSR 1:15 | Tier 2: FSR 1:20
  // Management: FSR 1:20
  // Pharmacy: FSR 1:15
  let fsrRatio = 20;
  if (discipline === 'engineering') {
    fsrRatio = accreditationTier === 'tier1' ? 15 : 20;
  } else if (discipline === 'pharmacy') {
    fsrRatio = 15;
  } else if (discipline === 'management') {
    fsrRatio = 20;
  }

  const totalRequiredFaculty = Math.ceil(totalStudents / fsrRatio);

  // Cadre Ratio 1 : 2 : 6 (Sum = 9 units)
  // Professors = Math.floor(totalRequiredFaculty / 9) minimum 1 if total faculty > 0
  const baseUnits = totalRequiredFaculty / 9;
  const professors = Math.max(1, Math.round(baseUnits * 1));
  const associateProfessors = Math.max(2, Math.round(baseUnits * 2));
  const assistantProfessors = Math.max(0, totalRequiredFaculty - (professors + associateProfessors));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in-50">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-teal-700 to-teal-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Calculator className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                AICTE Cadre Ratio & FSR Norms Calculator
              </h3>
              <p className="text-xs text-teal-200">
                APH 2025-26 Chapter VII Regulatory Standard
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-teal-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Discipline
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="engineering">Engineering & Tech</option>
                <option value="management">Management (MBA)</option>
                <option value="pharmacy">Pharmacy</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                NBA Accreditation
              </label>
              <select
                value={accreditationTier}
                onChange={(e) => setAccreditationTier(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="tier1">Tier-1 NBA (FSR 1:15)</option>
                <option value="tier2">Non-Accredited (FSR 1:20)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Total Enrolled Students
              </label>
              <input
                type="number"
                min={30}
                step={30}
                value={totalStudents}
                onChange={(e) => setTotalStudents(Math.max(30, Number(e.target.value)))}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>
          </div>

          {/* Results Card */}
          <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">
                Mandatory Statutory Requirements (FSR 1 : {fsrRatio})
              </span>
              <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                Total Required: {totalRequiredFaculty} Faculty
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-teal-200/80 dark:border-teal-800/80 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Professors (1)
                </span>
                <span className="text-xl font-extrabold text-teal-700 dark:text-teal-300">
                  {professors}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">PhD Mandatory</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-teal-200/80 dark:border-teal-800/80 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Assoc. Professors (2)
                </span>
                <span className="text-xl font-extrabold text-teal-700 dark:text-teal-300">
                  {associateProfessors}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Min 8 yrs exp</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-teal-200/80 dark:border-teal-800/80 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Asst. Professors (6)
                </span>
                <span className="text-xl font-extrabold text-teal-700 dark:text-teal-300">
                  {assistantProfessors}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">M.Tech / NET</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <p>
              <strong>APH Clause 7.1 Note:</strong> If an institution operates with an overall cadre ratio deficit exceeding 25%, AICTE regulatory rules mandate reduction of 50% sanctioned intake in non-compliant branches.
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Close Calculator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
