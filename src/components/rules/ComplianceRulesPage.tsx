import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calculator,
  CheckCircle2,
  Clock,
  Cpu,
  Filter,
  Layers,
  Scale,
  Search,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ComplianceRule } from '../../types';
import { Badge } from '../common/Badge';
import { CadreRatioCalculatorModal } from './CadreRatioCalculatorModal';

export const ComplianceRulesPage: React.FC = () => {
  const { complianceRules, toggleRuleActive, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const categories = [
    'all',
    'Faculty & Cadre Norms',
    'Land & Built-up Area',
    'Statutory NOCs & Safety',
    'Instructional Facilities',
    'Inclusive Infrastructure',
    'Financial Soundness',
  ];

  const filteredRules = useMemo(() => {
    return complianceRules.filter((rule) => {
      const matchesSearch =
        searchTerm === '' ||
        rule.clauseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.normRequirement.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || rule.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [complianceRules, searchTerm, selectedCategory]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            AICTE Approval Process Handbook (APH) Rulebook Engine
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
              APH 2025-26 Edition
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Statutory regulatory benchmarks governing land title, built-up area, faculty cadre ratio, and mandatory safety clearances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCalculatorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Cadre Ratio & FSR Calculator</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by rule code (e.g. APH-FSR-01) or keyword..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? `All Norms (${complianceRules.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-2xl border transition-all space-y-3 ${
              rule.isActive
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
            }`}
          >
            {/* Rule Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {rule.clauseCode}
                  </span>
                  <Badge variant="slate" size="xs">
                    {rule.category}
                  </Badge>
                  {rule.automatedCheck && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      <Cpu className="w-3 h-3" />
                      AI Automated
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {rule.title}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {rule.chapter} • Amended: {rule.lastAmended}
                </p>
              </div>

              {/* Active Toggle Switch */}
              <button
                onClick={() => toggleRuleActive(rule.id)}
                className="shrink-0 p-1 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                title={rule.isActive ? 'Deactivate Rule' : 'Activate Rule'}
              >
                {rule.isActive ? (
                  <ToggleRight className="w-7 h-7 text-teal-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-400" />
                )}
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {rule.description}
            </p>

            {/* Threshold & Norm Requirement Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Statutory APH Requirement:
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-medium">
                {rule.normRequirement}
              </p>
            </div>

            {/* Penalty Citation */}
            <div className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Deficiency Consequence:</strong> {rule.penaltyClause}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Cadre Ratio Calculator Modal */}
      <CadreRatioCalculatorModal
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
      />
    </div>
  );
};
