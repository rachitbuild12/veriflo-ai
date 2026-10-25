import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
          info: <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
        };

        const borderColors = {
          success: 'border-l-emerald-500',
          info: 'border-l-teal-500',
          warning: 'border-l-amber-500',
          error: 'border-l-rose-500',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 ${borderColors[toast.type]} rounded-lg shadow-xl shadow-slate-900/10 dark:shadow-black/40 text-slate-900 dark:text-slate-100 transition-all duration-300 animate-in slide-in-from-top-3`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-800 dark:text-slate-200 mb-0.5">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
