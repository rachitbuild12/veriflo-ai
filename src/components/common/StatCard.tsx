import React from 'react';
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
    label?: string;
  };
  accentColor?: 'teal' | 'navy' | 'amber' | 'emerald' | 'rose' | 'indigo';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'teal',
  onClick,
}) => {
  const accentBorder = {
    teal: 'hover:border-teal-400 dark:hover:border-teal-500/50',
    navy: 'hover:border-blue-400 dark:hover:border-blue-500/50',
    amber: 'hover:border-amber-400 dark:hover:border-amber-500/50',
    emerald: 'hover:border-emerald-400 dark:hover:border-emerald-500/50',
    rose: 'hover:border-rose-400 dark:hover:border-rose-500/50',
    indigo: 'hover:border-indigo-400 dark:hover:border-indigo-500/50',
  };

  const iconColors = {
    teal: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800/80',
    navy: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/80',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/80',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80',
    rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/80',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${accentBorder[accentColor]} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg border ${iconColors[accentColor]} transition-transform duration-200 group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center gap-1.5 text-xs">
          {trend.positive ? (
            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              {trend.value}
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-semibold">
              <TrendingDown className="w-3.5 h-3.5" />
              {trend.value}
            </span>
          )}
          {trend.label && (
            <span className="text-slate-500 dark:text-slate-400">
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
