import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DisclaimerBanner: React.FC = () => {
  const { setSihDemoModalOpen } = useApp();

  return (
    <div className="bg-slate-900 text-amber-300 dark:bg-slate-950 dark:text-amber-200 border-b border-amber-500/20 px-3 py-1.5 text-[11px] sm:text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider shrink-0">
            <Shield className="w-3 h-3" />
            Synthetic Demo
          </span>
          <span className="text-slate-300 dark:text-slate-300 truncate">
            <strong>Veriflo AI:</strong> AI-Powered Application Validation, Document Authentication & Regulatory Compliance Verification. Simulated benchmark records for evaluation only.
          </span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setSihDemoModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] uppercase tracking-wider transition-all hover:scale-105 shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-teal-200" />
            <span>Launch SIH Guided Tour</span>
          </button>
          <div className="hidden lg:flex items-center gap-2 text-slate-400 text-[11px]">
            <span>•</span>
            <span>APH 2025-26 Norms Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
