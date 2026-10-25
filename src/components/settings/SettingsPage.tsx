import React, { useState } from 'react';
import {
  Award,
  Bot,
  CheckCircle2,
  Database,
  Moon,
  RefreshCw,
  Save,
  Scale,
  Shield,
  Sliders,
  Sun,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OfficerRole } from '../../types';

export const SettingsPage: React.FC = () => {
  const {
    stats,
    darkMode,
    toggleDarkMode,
    currentRole,
    setCurrentRole,
    resetToDemoData,
    addToast,
    logAuditAction,
  } = useApp();

  // AI Threshold Sliders
  const [ocrSensitivity, setOcrSensitivity] = useState(85);
  const [tamperSensitivity, setTamperSensitivity] = useState(90);
  const [fsrTolerance, setFsrTolerance] = useState(5);
  const [autoFlagThreshold, setAutoFlagThreshold] = useState(70);

  const handleSaveThresholds = () => {
    addToast('success', 'AI Regulatory sensitivity thresholds saved and updated on active microservices.', 'Parameters Saved');
    logAuditAction(`AI Scrutiny Sensitivity Adjusted: OCR=${ocrSensitivity}%, Tamper=${tamperSensitivity}%`, 'AI Governance Config', 'RULE_UPDATE', 'Info');
  };

  const handleRoleSelect = (role: OfficerRole) => {
    setCurrentRole(role);
    addToast('info', `Active officer role switched to: ${role}`, 'Role Updated');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          Regulatory Parameters & Governance Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure AI inspection confidence bounds, active scrutiny cycle deadlines, and officer access privileges.
        </p>
      </div>

      {/* AI Scrutiny Sensitivity Parameters */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                AI Regulatory Verification Thresholds
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Neural parameters for OCR entity extraction and forensic anomaly detection
              </p>
            </div>
          </div>
          <span className="font-mono text-xs text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-200 dark:border-teal-800">
            Model: GovVision-OCR-v4
          </span>
        </div>

        <div className="space-y-4 text-xs">
          {/* OCR Match Sensitivity */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
              <span>OCR Entity Matching Confidence Threshold:</span>
              <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">{ocrSensitivity}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={99}
              value={ocrSensitivity}
              onChange={(e) => setOcrSensitivity(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Scanned text below this threshold triggers an automatic "Officer Manual Review Needed" flag.
            </p>
          </div>

          {/* Tamper / Forgery Detection Sensitivity */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
              <span>Digital Forgery & Metadata Tampering Sensitivity:</span>
              <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{tamperSensitivity}%</span>
            </div>
            <input
              type="range"
              min={60}
              max={99}
              value={tamperSensitivity}
              onChange={(e) => setTamperSensitivity(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Sensitivity to font kerning variations, duplicate image layers, and modified PDF dates.
            </p>
          </div>

          {/* FSR Tolerance Margin */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
              <span>Faculty Cadre Ratio Relaxation Buffer:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{fsrTolerance}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              value={fsrTolerance}
              onChange={(e) => setFsrTolerance(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Permissible temporary vacancy margin before issuing mandatory intake curtailment notice.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveThresholds}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save AI Parameters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Switcher Section */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Simulated Officer Identity & Clearance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Switch role perspective to test different tiers of regulatory approvals and committee workflows.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            {
              role: 'Regional Scrutiny Officer (WRO)' as OfficerRole,
              badge: 'Level 2 Committee',
              desc: 'Handles western regional institutional scrutiny and issues deficiency memos.',
            },
            {
              role: 'Senior Director (Approval Bureau)' as OfficerRole,
              badge: 'Executive HQ',
              desc: 'Executes national approval orders and grants final Extension of Approval (EoA).',
            },
            {
              role: 'Standing Appellate Committee Member' as OfficerRole,
              badge: 'Appellate Tribunal',
              desc: 'Reviews contested institutional show-cause appeals and orders physical inspections.',
            },
            {
              role: 'System Auditor / Vigilance Officer' as OfficerRole,
              badge: 'Vigilance & Forensics',
              desc: 'Monitors immutable audit logs, hash integrity, and officer overrides.',
            },
          ].map((item) => (
            <div
              key={item.role}
              onClick={() => handleRoleSelect(item.role)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                currentRole === item.role
                  ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-1 ring-teal-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 dark:text-white">
                  {item.role}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {item.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interface & Theme Appearance */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Interface Theme & Visual Density
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              GovTech high-contrast theme optimized for regulatory verification displays
            </p>
          </div>

          <button
            onClick={toggleDarkMode}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Theme</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span>Dark Theme (Deep Navy)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Synthetic Demo Data Controls */}
      <div className="p-5 sm:p-6 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-3 text-xs">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider text-xs">
          <Database className="w-4 h-4" />
          <span>Demo Simulation Data Management</span>
        </div>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          VerifiAI runs on simulated synthetic datasets for regulatory testing. You can reset all applications, documents, deficiency notices, and audit records back to the initial demo benchmark state at any time.
        </p>
        <div className="pt-1">
          <button
            onClick={resetToDemoData}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Datasets to Default</span>
          </button>
        </div>
      </div>
    </div>
  );
};
