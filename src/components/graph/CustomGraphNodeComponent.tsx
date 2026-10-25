import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GraphNodeData } from './graphModel';
import {
  Building,
  FileText,
  FileCheck2,
  Cpu,
  Scale,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  BadgeAlert,
} from 'lucide-react';

export const CustomGraphNodeComponent: React.FC<NodeProps> = memo((props) => {
  const data = props.data as unknown as GraphNodeData;
  const isSelected = props.selected;

  const isConflictNode =
    data.nodeType === 'DISCREPANCY' ||
    data.status === 'TAMPER_ALERT' ||
    data.status === 'CRITICAL_DEFICIT' ||
    !!data.conflictingValues;

  const getNodeIcon = () => {
    switch (data.nodeType) {
      case 'INSTITUTION':
        return <Building className="w-4 h-4 text-sky-500" />;
      case 'APPLICATION':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'DOCUMENT':
        return <FileCheck2 className="w-4 h-4 text-teal-600" />;
      case 'EXTRACTED_FIELD':
        return <Cpu className="w-4 h-4 text-cyan-600" />;
      case 'REGULATORY_RULE':
        return <Scale className="w-4 h-4 text-amber-500" />;
      case 'DISCREPANCY':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'VERIFICATION_RESULT':
        return data.status === 'CRITICAL_DEFICIT' ? (
          <ShieldAlert className="w-4 h-4 text-rose-600" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        );
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (data.status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        );
      case 'TAMPER_ALERT':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse">
            <BadgeAlert className="w-3 h-3 text-rose-600" />
            Tamper Alert
          </span>
        );
      case 'CRITICAL_DEFICIT':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Deficit
          </span>
        );
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
            <CheckCircle2 className="w-3 h-3" />
            Compliant
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Pending
          </span>
        );
    }
  };

  const getBorderAndBgStyle = () => {
    if (isConflictNode) {
      return 'border-rose-400 dark:border-rose-700 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm shadow-rose-500/10';
    }
    switch (data.nodeType) {
      case 'INSTITUTION':
        return 'border-sky-300 dark:border-sky-800 bg-sky-50/30 dark:bg-sky-950/20';
      case 'APPLICATION':
        return 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20';
      case 'DOCUMENT':
        return 'border-teal-300 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20';
      case 'EXTRACTED_FIELD':
        return 'border-cyan-300 dark:border-cyan-800 bg-cyan-50/20 dark:bg-cyan-950/20';
      case 'REGULATORY_RULE':
        return 'border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20';
      case 'VERIFICATION_RESULT':
        return 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20';
      default:
        return 'border-slate-300 dark:border-slate-700 bg-card';
    }
  };

  return (
    <div
      className={`relative group rounded-xl border transition-all duration-200 cursor-pointer w-[280px] p-3 shadow-sm bg-white dark:bg-slate-900 ${getBorderAndBgStyle()} ${
        isSelected
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md'
          : 'hover:shadow-md hover:border-primary/60'
      }`}
    >
      {/* Target & Source Handles - 4 directions */}
      <Handle
        type="target"
        id="target-left"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500 opacity-60 hover:opacity-100"
      />
      <Handle
        type="source"
        id="source-left"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500 opacity-60 hover:opacity-100"
      />
      <Handle
        type="target"
        id="target-right"
        position={Position.Right}
        className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500 opacity-60 hover:opacity-100"
      />
      <Handle
        type="source"
        id="source-right"
        position={Position.Right}
        className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500 opacity-60 hover:opacity-100"
      />
      <Handle
        type="target"
        id="target-top"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500 opacity-60 hover:opacity-100"
      />
      <Handle
        type="source"
        id="source-top"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500 opacity-60 hover:opacity-100"
      />
      <Handle
        type="target"
        id="target-bottom"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500 opacity-60 hover:opacity-100"
      />
      <Handle
        type="source"
        id="source-bottom"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500 opacity-60 hover:opacity-100"
      />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800">
            {getNodeIcon()}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {data.nodeType.replace('_', ' ')}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Primary Label */}
      <div className="mb-1">
        <h4
          className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight"
          title={data.label}
        >
          {data.label}
        </h4>
        {data.sublabel && (
          <p
            className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5"
            title={data.sublabel}
          >
            {data.sublabel}
          </p>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          {data.pageNumber && (
            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-medium">
              p.{data.pageNumber}
            </span>
          )}
          {data.confidenceScore && (
            <span className="text-slate-500">
              {data.confidenceScore.toFixed(0)}% conf
            </span>
          )}
          {data.isSynthetic && (
            <span className="text-[9px] px-1 py-0.2 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded">
              Demo
            </span>
          )}
        </div>
        <div className="flex items-center text-primary group-hover:translate-x-0.5 transition-transform font-medium">
          <span>Inspect</span>
          <ChevronRight className="w-3 h-3 ml-0.5" />
        </div>
      </div>

      {/* Discrepancy Alert Banner */}
      {isConflictNode && (
        <div className="mt-1.5 px-2 py-1 rounded bg-rose-100/80 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-[10px] text-rose-800 dark:text-rose-200 flex items-center justify-between font-medium">
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
            Cross-Check Conflict
          </span>
          <span className="text-[9px] uppercase tracking-wide px-1 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
            {data.severity || 'Critical'}
          </span>
        </div>
      )}
    </div>
  );
});

CustomGraphNodeComponent.displayName = 'CustomGraphNodeComponent';
