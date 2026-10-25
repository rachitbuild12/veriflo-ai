import React from 'react';
import { Award, CheckCircle2, Key, Shield, User, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OfficerRole } from '../../types';

export const OfficerProfileModal: React.FC = () => {
  const {
    profileModalOpen,
    setProfileModalOpen,
    currentRole,
    setCurrentRole,
    addToast,
    logAuditAction,
  } = useApp();

  if (!profileModalOpen) return null;

  const roles: Array<{ role: OfficerRole; jurisdiction: string; clearanceLevel: string; desc: string }> = [
    {
      role: 'Regional Scrutiny Officer (WRO)',
      jurisdiction: 'Western Region (Maharashtra, Goa, Gujarat)',
      clearanceLevel: 'Level 2 - Scrutiny & Deficiency Authority',
      desc: 'Performs primary AI scrutiny oversight, issues deficiency communications, and checks physical infrastructural reports.',
    },
    {
      role: 'Senior Director (Approval Bureau)',
      jurisdiction: 'National HQ (New Delhi)',
      clearanceLevel: 'Level 4 - Final EoA Granting Authority',
      desc: 'Grants final Extension of Approval (EoA), signs digital orders, and oversees pan-India quota allocations.',
    },
    {
      role: 'Standing Appellate Committee Member',
      jurisdiction: 'Appellate Tribunal',
      clearanceLevel: 'Level 3 - Quasi-Judicial Appeals Authority',
      desc: 'Hears contested deficiency notices, reviews institutional appeals, and orders re-inspections.',
    },
    {
      role: 'System Auditor / Vigilance Officer',
      jurisdiction: 'Chief Vigilance Division',
      clearanceLevel: 'Full Read & Forensic Audit Access',
      desc: 'Monitors tamper logs, officer overrides, cryptographic hashes, and integrity benchmarks.',
    },
  ];

  const handleRoleChange = (newRole: OfficerRole) => {
    setCurrentRole(newRole);
    logAuditAction(`Officer Session Role Switched to: ${newRole}`, 'GovNet Auth Service', 'STATUS_CHANGE', 'Info');
    addToast('info', `Active user role switched to ${newRole}. Permissions and queue updated.`, 'Role Changed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-50">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#071626] to-[#102A43] p-6 text-white border-b border-slate-800">
          <button
            onClick={() => setProfileModalOpen(false)}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-600/90 border-2 border-teal-400/50 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-teal-950/50 shrink-0">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Er. Rajesh V. Patil</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  DSC Class 3 Active
                </span>
              </div>
              <p className="text-xs text-teal-300 font-medium mt-0.5">
                Senior Technical Officer • Emp ID: AICTE-EMP-7712
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ministry of Education, Govt. of India
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Security Credentials Banner */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Digital Signing Certificate
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200 text-[11px] flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                GovCA-2024-SHA256
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Session Encryption
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                TLS 1.3 / GovNet VPN
              </span>
            </div>
          </div>

          {/* Role Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Simulated Officer Role & Jurisdiction
              </h4>
              <span className="text-[11px] text-slate-400">Select to test perspective</span>
            </div>

            <div className="space-y-2">
              {roles.map((r) => {
                const isSelected = currentRole === r.role;
                return (
                  <div
                    key={r.role}
                    onClick={() => handleRoleChange(r.role)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 shadow-sm ring-1 ring-teal-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {r.role}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-teal-600 text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-teal-700 dark:text-teal-300 font-medium mt-0.5">
                      {r.jurisdiction} • {r.clearanceLevel}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {r.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => setProfileModalOpen(false)}
            className="px-4 py-2 text-xs font-medium rounded-lg text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
