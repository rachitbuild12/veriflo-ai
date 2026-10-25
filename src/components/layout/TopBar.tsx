import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Globe,
  Home,
  Menu,
  Moon,
  Search,
  Shield,
  Sparkles,
  Sun,
  UserCheck,
} from 'lucide-react';
import { NavigationTab, useApp } from '../../context/AppContext';

export const TopBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setMobileMenuOpen,
    darkMode,
    toggleDarkMode,
    currentRole,
    setSearchModalOpen,
    setProfileModalOpen,
    setSihDemoModalOpen,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    selectedApplicationId,
    applications,
  } = useApp();

  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.read);

  const tabLabels: Record<NavigationTab, string> = {
    overview: 'Overview',
    applications: 'Applications Directory',
    'document-verification': 'Document Verification',
    'compliance-time-machine': 'Compliance Time Machine',
    'evidence-dependency-graph': 'Evidence Dependency Graph',
    'blind-spot-detector': 'Verification Blind-Spot Detector',
    'infrastructure-review': 'Infrastructure Evidence Review',
    'compliance-rules': 'Compliance Rules',
    'institution-records': 'Institution Records',
    'review-queue': 'Review Queue',
    'verification-reports': 'Verification Reports',
    'audit-trail': 'Audit Trail',
    settings: 'Settings & Governance',
  };

  const selectedApp = selectedApplicationId
    ? applications.find((a) => a.id === selectedApplicationId)
    : null;

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-[#071626]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between h-14 px-3 sm:px-6 gap-3">
        {/* Left: Mobile hamburger & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Veriflo AI</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {tabLabels[activeTab]}
            </span>
            {selectedApp && activeTab === 'applications' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-teal-600 dark:text-teal-400 truncate max-w-[140px]">
                  {selectedApp.applicationNumber}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Center: Global Search Trigger */}
        <div className="flex-1 max-w-md mx-2">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-300 text-xs transition-all shadow-inner"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Search applications, colleges, rules...</span>
            </span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Notifications, Theme, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Active Jurisdiction Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800/80 text-[11px] font-medium text-teal-700 dark:text-teal-300">
            <Globe className="w-3 h-3 text-teal-500 shrink-0" />
            <span className="truncate max-w-[130px]">AICTE WRO Zone</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationDropdownOpen((prev) => !prev)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-pulse">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {notificationDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 z-50">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Regulatory Alerts
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-[10px] font-semibold">
                      {unreadNotifications.length} unread
                    </span>
                  </div>
                  {unreadNotifications.length > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        markNotificationRead(item.id);
                        if (item.linkRoute) {
                          setActiveTab(item.linkRoute as NavigationTab);
                          setNotificationDropdownOpen(false);
                        }
                      }}
                      className={`p-3 text-xs cursor-pointer transition-colors ${
                        item.read
                          ? 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          : 'bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-semibold text-xs ${
                            item.type === 'tamper'
                              ? 'text-rose-600 dark:text-rose-400'
                              : item.type === 'deadline'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setActiveTab('review-queue');
                      setNotificationDropdownOpen(false);
                    }}
                    className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    View All Queued Actions →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SIH Tour Quick Access Pill */}
          <button
            onClick={() => setSihDemoModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/10 hover:bg-teal-600/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all hover:scale-[1.02]"
            title="Launch SIH Interactive Scrutiny Tour"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>SIH Tour</span>
          </button>

          {/* Officer Profile Button */}
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-[11px] font-bold leading-tight truncate max-w-[120px]">
                {currentRole.split('(')[0].trim()}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                Verified Signatory
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
