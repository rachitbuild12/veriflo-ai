import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  CheckSquare,
  Clock,
  EyeOff,
  Filter,
  Play,
  Scale,
  Search,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReviewQueueItem } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { QuickDecisionDrawer } from './QuickDecisionDrawer';

export const ReviewQueuePage: React.FC = () => {
  const {
    reviewQueue,
    setSelectedApplicationId,
    setActiveTab,
    addToast,
    claims,
    blindSpotRecords,
    setActiveClaimForManualVerification,
    setManualVerificationModalOpen,
  } = useApp();

  const [priorityFilter, setPriorityFilter] = useState<'all' | 'Urgent' | 'High' | 'Normal' | 'BlindSpots'>('all');
  const [selectedQueueItem, setSelectedQueueItem] = useState<ReviewQueueItem | null>(null);

  const filteredQueue = useMemo(() => {
    if (priorityFilter === 'all') return reviewQueue;
    if (priorityFilter === 'BlindSpots') {
      return reviewQueue.filter((item) =>
        blindSpotRecords.some((b) => !b.resolved && (b.applicationId === item.applicationId || b.pid === item.pid)) ||
        claims.some((c) => c.status === 'Manual verification required' && (c.applicationId === item.applicationId || c.pid === item.pid))
      );
    }
    return reviewQueue.filter((item) => item.priority === priorityFilter);
  }, [reviewQueue, priorityFilter, blindSpotRecords, claims]);

  const handleBatchClearNormal = () => {
    addToast('success', 'Batch cleared 2 low-risk items conforming to standard norms.', 'Batch Review Completed');
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Officer Scrutiny & Review Worklist
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              {reviewQueue.length} Pending Actions
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Prioritized regulatory queues based on AI-flagged discrepancies, expired municipal NOCs, and cadral deficits.
          </p>
        </div>

        <button
          onClick={handleBatchClearNormal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-xs"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Batch Clear Compliant Cases</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setPriorityFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            priorityFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Items ({reviewQueue.length})
        </button>
        <button
          onClick={() => setPriorityFilter('Urgent')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            priorityFilter === 'Urgent'
              ? 'bg-rose-600 text-white'
              : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          }`}
        >
          Urgent ({reviewQueue.filter((r) => r.priority === 'Urgent').length})
        </button>
        <button
          onClick={() => setPriorityFilter('High')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            priorityFilter === 'High'
              ? 'bg-amber-600 text-white'
              : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
          }`}
        >
          High ({reviewQueue.filter((r) => r.priority === 'High').length})
        </button>
        <button
          onClick={() => setPriorityFilter('Normal')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            priorityFilter === 'Normal'
              ? 'bg-teal-600 text-white'
              : 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40'
          }`}
        >
          Normal ({reviewQueue.filter((r) => r.priority === 'Normal').length})
        </button>
        <button
          onClick={() => setPriorityFilter('BlindSpots')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
            priorityFilter === 'BlindSpots'
              ? 'bg-rose-700 text-white'
              : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Blind Spots & Manual Review ({blindSpotRecords.filter((b) => !b.resolved).length})</span>
        </button>
      </div>

      {/* Queue Items List */}
      <div className="space-y-3">
        {filteredQueue.map((item) => {
          const isUrgent = item.priority === 'Urgent';
          const isHigh = item.priority === 'High';

          return (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                isUrgent
                  ? 'bg-rose-50/30 dark:bg-rose-950/15 border-rose-200 dark:border-rose-900/60 shadow-xs'
                  : isHigh
                  ? 'bg-amber-50/30 dark:bg-amber-950/15 border-amber-200 dark:border-amber-900/60 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isUrgent ? 'danger' : isHigh ? 'warning' : 'teal'}
                      size="xs"
                    >
                      {item.priority} Priority
                    </Badge>
                    <span className="font-mono text-xs text-slate-500">
                      PID: {item.pid} • {item.region}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.daysInQueue} days in queue
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {item.institutionName}
                  </h3>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {item.flagReason}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <div className="text-right mr-2 hidden sm:block">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Risk Index</span>
                    <span className={`text-base font-extrabold ${item.aiRiskScore > 75 ? 'text-rose-500' : 'text-amber-500'}`}>
                      {item.aiRiskScore}/100
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedQueueItem(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-sm"
                  >
                    <span>Execute Decision</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Linked Blind Spot & Manual Verification Trigger */}
              {(() => {
                const linkedSpot = blindSpotRecords.find(
                  (b) => !b.resolved && (b.applicationId === item.applicationId || b.pid === item.pid)
                );
                const linkedClaim = claims.find(
                  (c) => (c.applicationId === item.applicationId || c.pid === item.pid) && (c.status === 'Manual verification required' || c.status === 'Source unavailable')
                );

                if (!linkedSpot && !linkedClaim) return null;

                return (
                  <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-semibold">
                        Verification Blind Spot: {linkedSpot?.title || 'Manual Source Verification Required'}
                      </span>
                    </div>

                    {linkedClaim && (
                      <button
                        onClick={() => {
                          setActiveClaimForManualVerification(linkedClaim);
                          setManualVerificationModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-teal-600 hover:bg-teal-700 text-white shrink-0 flex items-center gap-1 shadow-xs"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Perform Manual Review</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Recommended Action Pill */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                  <strong className="text-slate-800 dark:text-slate-200">Recommended Action:</strong>
                  <span>{item.recommendedAction}</span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <UserCheck className="w-3 h-3 text-teal-600" />
                  <span>Assigned to: <strong>{item.assignedTo}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Decision Drawer */}
      {selectedQueueItem && (
        <QuickDecisionDrawer
          item={selectedQueueItem}
          onClose={() => setSelectedQueueItem(null)}
        />
      )}
    </div>
  );
};
