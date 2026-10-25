import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded bg-slate-200 dark:bg-slate-800 ${className}`}
        />
      ))}
    </>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full space-y-3 p-4">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-6 flex-1 bg-slate-200 dark:bg-slate-800 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-2 border-b border-slate-100 dark:border-slate-800/60">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1 bg-slate-100 dark:bg-slate-800/40 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
};
