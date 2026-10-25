import React from 'react';
import { ToastContainer } from './components/common/ToastContainer';
import { DisclaimerBanner } from './components/layout/DisclaimerBanner';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { OfficerProfileModal } from './components/layout/OfficerProfileModal';
import { ManualVerificationModal } from './components/blindspot/ManualVerificationModal';
import { SihDemoWalkthroughModal } from './components/demo/SihDemoWalkthroughModal';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';

import { ApplicationsPage } from './components/applications/ApplicationsPage';
import { AuditLogsPage } from './components/audit/AuditLogsPage';
import { VerificationBlindSpotDetectorPage } from './components/blindspot/VerificationBlindSpotDetectorPage';
import { OverviewPage } from './components/dashboard/OverviewPage';
import { DocumentVerificationPage } from './components/documents/DocumentVerificationPage';
import { EvidenceDependencyGraphPage } from './components/graph/EvidenceDependencyGraphPage';
import { InstitutionRecordsPage } from './components/institutions/InstitutionRecordsPage';
import { VerificationReportsPage } from './components/reports/VerificationReportsPage';
import { ReviewQueuePage } from './components/review/ReviewQueuePage';
import { ComplianceRulesPage } from './components/rules/ComplianceRulesPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ComplianceTimeMachinePage } from './components/timemachine/ComplianceTimeMachinePage';
import { InfrastructureReviewPage } from './components/infrastructure/InfrastructureReviewPage';

import { AppProvider, useApp } from './context/AppContext';

const AppContent: React.FC = () => {
  const {
    activeTab,
    manualVerificationModalOpen,
    setManualVerificationModalOpen,
    activeClaimForManualVerification,
    setActiveClaimForManualVerification,
    sihDemoModalOpen,
    setSihDemoModalOpen,
  } = useApp();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'applications':
        return <ApplicationsPage />;
      case 'document-verification':
        return <DocumentVerificationPage />;
      case 'compliance-time-machine':
        return <ComplianceTimeMachinePage />;
      case 'evidence-dependency-graph':
        return <EvidenceDependencyGraphPage />;
      case 'blind-spot-detector':
        return <VerificationBlindSpotDetectorPage />;
      case 'infrastructure-review':
        return <InfrastructureReviewPage />;
      case 'compliance-rules':
        return <ComplianceRulesPage />;
      case 'institution-records':
        return <InstitutionRecordsPage />;
      case 'review-queue':
        return <ReviewQueuePage />;
      case 'verification-reports':
        return <VerificationReportsPage />;
      case 'audit-trail':
      case 'audit-logs' as any:
        return <AuditLogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#071626] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Regulatory Synthetic Banner */}
      <DisclaimerBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar Navigation */}
          <TopBar />

          {/* Page View Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderActivePage()}
          </main>

          {/* GovTech Footer */}
          <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 py-4 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Veriflo AI
                </span>{' '}
                • AI-Powered Application Validation, Document Authentication & Regulatory Compliance Verification
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>GovNet TLS 1.3</span>
                <span>•</span>
                <span>Class 3 DSC Authenticated</span>
                <span>•</span>
                <span className="text-amber-500 font-sans font-semibold">[Synthetic Demo]</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Modals & Toast Alerts */}
      <ToastContainer />
      <GlobalSearchModal />
      <OfficerProfileModal />
      <ManualVerificationModal
        isOpen={manualVerificationModalOpen}
        claim={activeClaimForManualVerification}
        onClose={() => {
          setManualVerificationModalOpen(false);
          setActiveClaimForManualVerification(null);
        }}
      />
      <SihDemoWalkthroughModal
        isOpen={sihDemoModalOpen}
        onClose={() => setSihDemoModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
