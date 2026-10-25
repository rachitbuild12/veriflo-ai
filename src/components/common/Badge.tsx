import React from 'react';
import { ApplicationStatus, RiskLevel } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'teal' | 'success' | 'warning' | 'danger' | 'purple' | 'slate' | 'amber';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    teal: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    amber: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
  };

  const dotColors = {
    primary: 'bg-blue-500',
    teal: 'bg-teal-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    purple: 'bg-indigo-500',
    amber: 'bg-orange-500',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 font-medium',
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border tracking-tight transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => {
  switch (status) {
    case 'Approved / EoA Issued':
      return <Badge variant="success" dot>{status}</Badge>;
    case 'Under AI Scrutiny':
      return <Badge variant="teal" dot>{status}</Badge>;
    case 'Level 2: Scrutiny Committee' as any:
    case 'Level 1: AI Scrutiny & OCR' as any:
      return <Badge variant="primary" dot>{status}</Badge>;
    case 'Deficiencies Communicated':
      return <Badge variant="warning" dot>{status}</Badge>;
    case 'Hearing / Appellate':
      return <Badge variant="amber" dot>{status}</Badge>;
    case 'EVC Physical Inspection':
      return <Badge variant="purple" dot>{status}</Badge>;
    case 'Rejected':
      return <Badge variant="danger" dot>{status}</Badge>;
    case 'Draft':
    default:
      return <Badge variant="slate">{status}</Badge>;
  }
};

export const RiskBadge: React.FC<{ risk: RiskLevel }> = ({ risk }) => {
  switch (risk) {
    case 'Low':
      return <Badge variant="success" size="xs">Low Risk</Badge>;
    case 'Medium':
      return <Badge variant="warning" size="xs">Medium Risk</Badge>;
    case 'High':
      return <Badge variant="amber" size="xs">High Risk</Badge>;
    case 'Severe':
      return <Badge variant="danger" size="xs">Severe Deficit</Badge>;
  }
};
