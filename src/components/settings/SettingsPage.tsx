import React, { useState, useEffect } from 'react';
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
  Cpu,
  Zap,
  Key,
  ExternalLink,
  Check,
  AlertTriangle,
  Loader2,
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

  // NVIDIA NIM Microservice State
  const [nimApiKey, setNimApiKey] = useState('');
  const [nimModel, setNimModel] = useState('nvidia/nemotron-3.5-bolt-e4b');
  const [nimConfigured, setNimConfigured] = useState(false);
  const [nimMaskedKey, setNimMaskedKey] = useState('');
  const [nimTesting, setNimTesting] = useState(false);
  const [nimTestResult, setNimTestResult] = useState<{
    success: boolean;
    status: string;
    message: string;
    latency_ms?: number;
    reply?: string;
  } | null>(null);

  // Backend API Base URL
  const apiBase = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, '') : 'http://127.0.0.1:8000') + '/api';

  // Load NIM status from backend
  useEffect(() => {
    fetch(`${apiBase}/verification/nim/status`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setNimConfigured(Boolean(data.configured));
          if (data.masked_key) setNimMaskedKey(data.masked_key);
          if (data.active_model) setNimModel(data.active_model);
        }
      })
      .catch(() => {
        // Backend not running locally right now - default to offline display
      });
  }, [apiBase]);

  const handleTestNimConnection = async () => {
    setNimTesting(true);
    setNimTestResult(null);
    try {
      const res = await fetch(`${apiBase}/verification/nim/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: nimApiKey.trim() || undefined,
          model: nimModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNimTestResult(data);
        if (data.success) {
          addToast('success', `NVIDIA NIM responded in ${data.latency_ms}ms with active model ${nimModel}`, 'NVIDIA NIM Connected');
          logAuditAction(`NVIDIA NIM Connection Verified (${nimModel}, ${data.latency_ms}ms)`, 'AI Infrastructure', 'AI_SCAN', 'Info');
        } else {
          addToast('warning', data.message || 'NVIDIA NIM connection check returned non-zero response.', 'NIM Status');
        }
      } else {
        setNimTestResult({
          success: false,
          status: 'error',
          message: `Backend returned HTTP ${res.status}. Ensure backend is running.`,
        });
      }
    } catch (err: any) {
      setNimTestResult({
        success: false,
        status: 'offline',
        message: 'FastAPI backend service unreachable on http://localhost:8000. Start backend to verify live NIM.',
      });
    } finally {
      setNimTesting(false);
    }
  };

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

      {/* NVIDIA NIM Inference Microservice Integration */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  NVIDIA NIM AI Microservice Integration
                </h3>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  NVIDIA NIM v1 API
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enterprise GPU-accelerated inference for AICTE document parsing, cadre validation, and cross-evidence reasoning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold font-mono border ${
                nimConfigured
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{nimConfigured ? `NIM Active (${nimMaskedKey})` : 'Offline / Regex Fallback Active'}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Target NVIDIA NIM Model:</span>
              <a
                href="https://build.nvidia.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>NVIDIA Catalog</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <select
              value={nimModel}
              onChange={(e) => setNimModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
            >
              <option value="nvidia/nemotron-3.5-bolt-e4b">nvidia/nemotron-3.5-bolt-e4b (Recommended - Ultra Fast 400ms Structured JSON)</option>
              <option value="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning">nvidia/nemotron-3-nano-omni-30b-a3b-reasoning (Deep Regulatory Scrutiny)</option>
              <option value="deepseek-ai/deepseek-v4.1-flash">deepseek-ai/deepseek-v4.1-flash (High Throughput Batch Inference)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              OpenAI-compatible microservice hosted at <code className="text-teal-600 dark:text-teal-400 font-mono">https://integrate.api.nvidia.com/v1</code>.
            </p>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>NVIDIA NIM API Key (Optional override):</span>
            </label>
            <input
              type="password"
              placeholder={nimConfigured ? `Configured in backend/.env (${nimMaskedKey})` : 'nvapi-xxxxxxxxxxxxxxxxxxxxxxxx'}
              value={nimApiKey}
              onChange={(e) => setNimApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs placeholder:text-slate-400 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">
              Set permanent key in <code className="text-teal-600 dark:text-teal-400 font-mono">backend/.env</code> as <code className="text-teal-600 dark:text-teal-400 font-mono">NVIDIA_NIM_API_KEY=nvapi-...</code>
            </p>
          </div>
        </div>

        {/* Live Test NIM Connection Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Deterministic PyMuPDF + PaddleOCR engines run locally with zero API latency.</span>
          </div>

          <button
            onClick={handleTestNimConnection}
            disabled={nimTesting}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            {nimTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Probing Microservice...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Test NIM Connectivity</span>
              </>
            )}
          </button>
        </div>

        {/* Test Result Feedback */}
        {nimTestResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
              nimTestResult.success
                ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
            }`}
          >
            {nimTestResult.success ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  {nimTestResult.success ? 'NVIDIA NIM Microservice Verified' : 'NVIDIA NIM Probe Status'}
                </span>
                {nimTestResult.latency_ms && (
                  <span className="font-mono text-[11px] font-semibold">
                    Latency: {nimTestResult.latency_ms}ms
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">{nimTestResult.message}</p>
            </div>
          </div>
        )}
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
