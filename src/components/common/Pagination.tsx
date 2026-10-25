import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (items: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
      <div className="flex items-center gap-2">
        <span>
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</span> records
        </span>

        {onItemsPerPageChange && (
          <div className="ml-3 flex items-center gap-1.5">
            <span>Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNum = i + 1;
          // Show only relevant pages around current page if many pages
          if (
            totalPages > 7 &&
            pageNum !== 1 &&
            pageNum !== totalPages &&
            Math.abs(pageNum - currentPage) > 1
          ) {
            if (pageNum === 2 || pageNum === totalPages - 1) {
              return <span key={pageNum} className="px-1 text-slate-400">...</span>;
            }
            return null;
          }

          const isActive = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-7 h-7 px-2 rounded-md font-medium text-xs transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
