import React from 'react';
import {
  BarChart3,
  Building,
  Building2,
  Camera,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  EyeOff,
  FileCheck2,
  FileSearch,
  FileText,
  GitFork,
  History,
  Scale,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { NavigationTab, useApp } from '../../context/AppContext';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeVariant?: 'primary' | 'warning' | 'danger' | 'slate' | 'teal';
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    reviewQueue,
    documents,
    applications,
    blindSpots,
  } = useApp();

  const flaggedDocsCount = documents.filter(
    (d) => d.verificationStatus === 'Tampering / Forgery Suspected' || d.verificationStatus === 'Deficiency Flagged'
  ).length;

  const urgentQueueCount = reviewQueue.filter((r) => r.priority === 'Urgent' || r.priority === 'High').length;
  const openGapsCount = blindSpots.filter((b) => b.status === 'Open Gap').length;

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    {
      id: 'applications',
      label: 'Applications',
      icon: FileText,
      badge: applications.length,
      badgeVariant: 'slate',
    },
    {
      id: 'document-verification',
      label: 'Document Verification',
      icon: FileSearch,
      badge: flaggedDocsCount > 0 ? `${flaggedDocsCount} Flagged` : undefined,
      badgeVariant: flaggedDocsCount > 0 ? 'danger' : 'slate',
    },
    {
      id: 'infrastructure-review',
      label: 'Infrastructure Evidence Review',
      icon: Building,
      badge: 'Visual AI',
      badgeVariant: 'teal',
    },
    {
      id: 'compliance-time-machine',
      label: 'Compliance Time Machine',
      icon: Clock,
      badge: 'Predict',
      badgeVariant: 'teal',
    },
    {
      id: 'evidence-dependency-graph',
      label: 'Evidence Dependency Graph',
      icon: Share2,
      badge: 'Trace',
      badgeVariant: 'primary',
    },
    {
      id: 'blind-spot-detector',
      label: 'Verification Blind-Spot Detector',
      icon: EyeOff,
      badge: openGapsCount > 0 ? `${openGapsCount} Gaps` : undefined,
      badgeVariant: 'warning',
    },
    { id: 'compliance-rules', label: 'Compliance Rules', icon: Scale },
    { id: 'institution-records', label: 'Institution Records', icon: Building2 },
    {
      id: 'review-queue',
      label: 'Review Queue',
      icon: CheckSquare,
      badge: urgentQueueCount > 0 ? urgentQueueCount : undefined,
      badgeVariant: 'warning',
    },
    { id: 'verification-reports', label: 'Verification Reports', icon: FileCheck2 },
    { id: 'audit-trail', label: 'Audit Trail', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#071626] text-slate-200 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-900/40 shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Veriflo AI
                <span className="text-[10px] font-semibold text-teal-400 bg-teal-950 border border-teal-800/60 px-1 rounded">
                  APH-AI
                </span>
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                AI Regulatory Verification
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrutiny Phase Status Pill */}
      {(!sidebarCollapsed || mobileMenuOpen) && (
        <div className="px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-medium text-slate-300">AY 2025-26 Cycle</span>
            <span className="text-teal-400 font-semibold">Phase 2 Active</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full w-[68%]" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
            <span>Validation & Appeals</span>
            <span>68% Evaluated</span>
          </div>
        </div>
      )}

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          const badgeClasses = {
            primary: 'bg-blue-900/80 text-blue-200 border-blue-700/60',
            teal: 'bg-teal-950 text-teal-300 border-teal-700/80',
            warning: 'bg-amber-900/80 text-amber-200 border-amber-700/60',
            danger: 'bg-rose-900/80 text-rose-200 border-rose-700/60',
            slate: 'bg-slate-800 text-slate-300 border-slate-700',
          };

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              title={sidebarCollapsed && !mobileMenuOpen ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-teal-600/90 to-teal-700 text-white shadow-sm shadow-teal-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
                }`}
              />
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
              {(!sidebarCollapsed || mobileMenuOpen) && item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                    badgeClasses[item.badgeVariant || 'slate']
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Collapse Toggle Button (Desktop only) */}
      <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-800/80 text-slate-400 text-xs">
        {!sidebarCollapsed && (
          <span className="text-[11px] text-slate-500 font-mono">Veriflo GovNet</span>
        )}
        <button
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          className="p-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors ml-auto"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div
          className={`fixed top-0 bottom-0 z-30 transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
