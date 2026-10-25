import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Building,
  FileText,
  FileCheck2,
  Cpu,
  Scale,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Filter,
  Download,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  Table as TableIcon,
  Network,
  X,
  ChevronRight,
  Maximize2,
  Eye,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  FileWarning,
  BadgeAlert,
  Info,
  Compass,
} from 'lucide-react';

import { useApp } from '../../context/AppContext';
import { CustomGraphNodeComponent } from './CustomGraphNodeComponent';
import {
  buildEvidenceGraph,
  buildFacultyMismatchDemoGraph,
  CustomGraphNode,
  CustomGraphEdge,
  GraphNodeType,
  GraphNodeData,
  ConflictingValueInfo,
} from './graphModel';
import { Badge } from '../common/Badge';

// Stable nodeTypes definition outside component
const nodeTypes = {
  custom: CustomGraphNodeComponent,
};

// Inner canvas component that can use `useReactFlow()`
const GraphCanvasInner: React.FC<{
  nodes: CustomGraphNode[];
  edges: CustomGraphEdge[];
  onNodesChange: any;
  onEdgesChange: any;
  onNodeClick: (event: React.MouseEvent, node: any) => void;
  selectedNodeId: string | null;
}> = ({ nodes, edges, onNodesChange, onEdgesChange, onNodeClick, selectedNodeId }) => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const styledNodes = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      selected: n.id === selectedNodeId,
    }));
  }, [nodes, selectedNodeId]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
        attributionPosition="bottom-left"
        className="bg-slate-50/50 dark:bg-slate-950/50"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#94A3B8" className="opacity-40" />
        <Controls showInteractive={false} position="bottom-right" className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-800 !rounded-lg !shadow-md" />
        <MiniMap
          nodeColor={(node: any) => {
            const data = node.data as GraphNodeData;
            if (data.status === 'TAMPER_ALERT' || data.status === 'CRITICAL_DEFICIT' || data.nodeType === 'DISCREPANCY') {
              return '#E11D48'; // red
            }
            if (data.nodeType === 'INSTITUTION') return '#0284C7';
            if (data.nodeType === 'APPLICATION') return '#6366F1';
            if (data.nodeType === 'DOCUMENT') return '#0D9488';
            if (data.nodeType === 'REGULATORY_RULE') return '#D97706';
            if (data.nodeType === 'EXTRACTED_FIELD') return '#06B6D4';
            return '#10B981';
          }}
          zoomable
          pannable
          position="top-right"
          className="!bg-white/90 dark:!bg-slate-900/90 !border-slate-200 dark:!border-slate-800 !rounded-xl !shadow-lg hidden md:block"
        />

        {/* Canvas Toolbar Panel */}
        <Panel position="top-left" className="m-3">
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <button
              onClick={() => fitView({ duration: 500, padding: 0.2 })}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-1.5 transition-colors"
              title="Fit entire graph to view"
            >
              <Maximize2 className="w-3.5 h-3.5 text-primary" />
              Fit View
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <button
              onClick={() => zoomIn({ duration: 300 })}
              className="px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => zoomOut({ duration: 300 })}
              className="px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              title="Zoom Out"
            >
              -
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export const EvidenceDependencyGraphPage: React.FC = () => {
  const {
    applications,
    documents,
    complianceRules,
    infrastructureEvidence,
    setSelectedApplicationId,
    setSelectedDocumentId,
    setSelectedInstitutionId,
    setActiveTab,
    addToast,
    logAuditAction,
  } = useApp();

  // Mode Selection: Demo Faculty Mismatch vs Live Application Dossiers
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [selectedAppId, setSelectedAppId] = useState<string>('APP-2025-03'); // Apex Horizon with faculty & fire discrepancies

  // View switch: Canvas vs Accessible Table
  const [viewMode, setViewMode] = useState<'canvas' | 'table'>('canvas');

  // Filter States
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showConflictsOnly, setShowConflictsOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Node for Drawer
  const [selectedNode, setSelectedNode] = useState<CustomGraphNode | null>(null);

  // Active conflict banner expanded state
  const [conflictBannerExpanded, setConflictBannerExpanded] = useState<boolean>(true);

  // Resolve target application
  const currentApp = useMemo(() => {
    return applications.find((a) => a.id === selectedAppId) || applications[0] || null;
  }, [applications, selectedAppId]);

  // Generate full graph data
  const rawGraphData = useMemo(() => {
    if (isDemoMode) {
      return buildFacultyMismatchDemoGraph();
    }
    return buildEvidenceGraph(currentApp, documents, complianceRules, false, infrastructureEvidence);
  }, [isDemoMode, currentApp, documents, complianceRules, infrastructureEvidence]);

  // Apply filters to nodes and edges
  const { filteredNodes, filteredEdges, visibleConflict } = useMemo(() => {
    let nodes = rawGraphData.nodes;

    // Filter by Node Type
    if (nodeTypeFilter !== 'ALL') {
      nodes = nodes.filter((n) => n.data.nodeType === nodeTypeFilter);
    }

    // Filter by Severity
    if (severityFilter !== 'ALL') {
      nodes = nodes.filter((n) => n.data.severity === severityFilter);
    }

    // Filter by Status
    if (statusFilter !== 'ALL') {
      nodes = nodes.filter((n) => n.data.status === statusFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      nodes = nodes.filter(
        (n) =>
          n.data.label.toLowerCase().includes(q) ||
          (n.data.sublabel && n.data.sublabel.toLowerCase().includes(q)) ||
          n.data.details.toLowerCase().includes(q)
      );
    }

    // Filter by Conflicts Only
    if (showConflictsOnly) {
      nodes = nodes.filter(
        (n) =>
          n.data.nodeType === 'DISCREPANCY' ||
          n.data.status === 'TAMPER_ALERT' ||
          n.data.status === 'CRITICAL_DEFICIT' ||
          !!n.data.conflictingValues
      );
    }

    const nodeIds = new Set(nodes.map((n) => n.id));

    // Keep only edges connecting visible nodes
    const edges = rawGraphData.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    // Find first discrepancy node for conflict display
    const conflictNode = rawGraphData.nodes.find(
      (n) => n.data.conflictingValues || n.data.nodeType === 'DISCREPANCY'
    );

    return {
      filteredNodes: nodes,
      filteredEdges: edges,
      visibleConflict: conflictNode?.data.conflictingValues || null,
    };
  }, [rawGraphData, nodeTypeFilter, severityFilter, statusFilter, searchQuery, showConflictsOnly]);

  // React Flow state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomGraphNode>(filteredNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomGraphEdge>(filteredEdges);

  // Sync state when filtered data changes
  useEffect(() => {
    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [filteredNodes, filteredEdges, setNodes, setEdges]);

  // Default select first discrepancy node or first node on load
  useEffect(() => {
    if (!selectedNode && rawGraphData.nodes.length > 0) {
      const disc = rawGraphData.nodes.find((n) => n.data.nodeType === 'DISCREPANCY');
      setSelectedNode(disc || rawGraphData.nodes[0]);
    }
  }, [rawGraphData]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNode(node as CustomGraphNode);
  }, []);

  const handleExportJSON = () => {
    const exportData = {
      title: isDemoMode
        ? 'Veriflo AI - Synthetic Faculty Mismatch Evidence Lineage'
        : `Veriflo AI - Evidence Lineage Dossier (${currentApp?.applicationNumber})`,
      generatedAt: new Date().toISOString(),
      isSyntheticDemo: isDemoMode,
      applicationId: currentApp?.id,
      institution: currentApp?.institutionName,
      nodes: rawGraphData.nodes,
      edges: rawGraphData.edges,
      hasConflicts: rawGraphData.hasConflicts,
      conflictCount: rawGraphData.conflictCount,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Evidence_Lineage_${isDemoMode ? 'Faculty_Mismatch_Demo' : currentApp?.applicationNumber || 'Graph'}.json`;
    link.click();
    URL.revokeObjectURL(url);

    addToast('success', 'Evidence dependency graph exported in standard GovTech JSON schema.', 'Export Complete');
    logAuditAction('Export Evidence Lineage Graph', currentApp?.applicationNumber || 'Demo Case', 'AI_SCAN', 'Info');
  };

  const handleResetFilters = () => {
    setNodeTypeFilter('ALL');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setShowConflictsOnly(false);
    setSearchQuery('');
  };

  const handleNavigateToEntity = (node: CustomGraphNode) => {
    const data = node.data;
    if (data.entityType === 'application' && data.entityId) {
      setSelectedApplicationId(data.entityId);
      setActiveTab('applications');
      addToast('info', `Navigating to application dossier ${data.label}`, 'Navigation');
    } else if (data.entityType === 'document' && data.entityId) {
      setSelectedDocumentId(data.entityId);
      setActiveTab('document-verification');
      addToast('info', `Navigating to document verification for ${data.sourceDocument || data.label}`, 'Navigation');
    } else if (data.entityType === 'rule') {
      setActiveTab('compliance-rules');
      addToast('info', `Navigating to Regulatory Rulebook for ${data.label}`, 'Navigation');
    } else if (data.entityType === 'institution') {
      setActiveTab('institution-records');
      addToast('info', `Navigating to Institution Records for ${data.label}`, 'Navigation');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Network className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Evidence Dependency Graph
              </h1>
              {isDemoMode ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Synthetic Demonstration Case
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                  Live Application Evidence
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
              Cross-document semantic lineage mapping regulatory claims, extracted OCR fields, statutory norms, and discovered discrepancies. All nodes represent persisted evidentiary records.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                onClick={() => setViewMode('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'canvas'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                Canvas View
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                Accessible Matrix
              </button>
            </div>

            {/* Export JSON Button */}
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 text-xs font-medium border border-border bg-card text-foreground hover:bg-accent rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Application & Demo Switcher Strip */}
        <div className="mt-4 pt-3.5 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-muted-foreground">Active Case:</span>
            <button
              onClick={() => {
                setIsDemoMode(true);
                setSelectedNode(null);
                addToast('info', 'Loaded synthetic Faculty Mismatch demonstration case.', 'Demo Loaded');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                isDemoMode
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Demo: Faculty Name Mismatch
            </button>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Or Select Dossier:</span>
              <select
                value={isDemoMode ? '' : selectedAppId}
                onChange={(e) => {
                  if (e.target.value) {
                    setIsDemoMode(false);
                    setSelectedAppId(e.target.value);
                    setSelectedNode(null);
                  }
                }}
                className="bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="" disabled={!isDemoMode}>
                  -- Choose Live Application --
                </option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.applicationNumber} • {app.institutionName.slice(0, 32)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
            <span>
              Total Nodes: <strong className="text-foreground">{filteredNodes.length}</strong>
            </span>
            <span>•</span>
            <span>
              Relationships: <strong className="text-foreground">{filteredEdges.length}</strong>
            </span>
            <span>•</span>
            <span>
              Conflicts:{' '}
              <strong className={rawGraphData.conflictCount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                {rawGraphData.conflictCount}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Cross-Document Inconsistency / Conflict Alert Banner */}
      {visibleConflict && (
        <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900 rounded-xl p-4 shadow-xs transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                <BadgeAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                    High-Priority Discrepancy Caught: {visibleConflict.field}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 uppercase">
                    Cross-Document Collision
                  </span>
                </div>
                <p className="text-xs text-rose-800/90 dark:text-rose-300/90 mt-0.5">
                  AI Entity Alignment caught diverging values for the same institutional claim across two independent documents.
                </p>
              </div>
            </div>

            <button
              onClick={() => setConflictBannerExpanded(!conflictBannerExpanded)}
              className="text-xs text-rose-700 dark:text-rose-400 hover:underline font-medium shrink-0"
            >
              {conflictBannerExpanded ? 'Hide Details' : 'View Comparison'}
            </button>
          </div>

          {conflictBannerExpanded && (
            <div className="mt-3.5 pt-3.5 border-t border-rose-200 dark:border-rose-900 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Document A Value */}
              <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-800/60">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
                    Source A: {visibleConflict.valueA.label}
                  </span>
                  {visibleConflict.valueA.page && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono font-medium text-[11px]">
                      Page {visibleConflict.valueA.page}
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  "{visibleConflict.valueA.value}"
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-1">
                  Filing: {visibleConflict.valueA.source}
                </p>
              </div>

              {/* Document B Value */}
              <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-rose-300 dark:border-rose-800/80 ring-1 ring-rose-400/30">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Source B: {visibleConflict.valueB.label}
                  </span>
                  {visibleConflict.valueB.page && (
                    <span className="px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900 font-mono font-medium text-[11px] text-rose-800 dark:text-rose-200">
                      Page {visibleConflict.valueB.page}
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-rose-900 dark:text-rose-200 p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  "{visibleConflict.valueB.value}"
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1.5 line-clamp-1">
                  Filing: {visibleConflict.valueB.source}
                </p>
              </div>

              {/* Statutory Citation & Recommended Action */}
              <div className="md:col-span-2 p-3 rounded-lg bg-rose-100/60 dark:bg-rose-950/40 text-xs text-rose-900 dark:text-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <strong>Statutory Standard: </strong>
                  <span>{visibleConflict.applicableRule}</span>
                  <div className="mt-0.5">
                    <strong>Recommended Action: </strong>
                    <span>{visibleConflict.recommendedAction}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const discNode = rawGraphData.nodes.find(
                      (n) => n.data.nodeType === 'DISCREPANCY'
                    );
                    if (discNode) setSelectedNode(discNode);
                  }}
                  className="px-3 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md shrink-0 transition-colors shadow-xs"
                >
                  Inspect in Graph
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>Filters:</span>
          </div>

          {/* Node Type Selector */}
          <select
            value={nodeTypeFilter}
            onChange={(e) => setNodeTypeFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Node Types</option>
            <option value="INSTITUTION">Institution</option>
            <option value="APPLICATION">Application</option>
            <option value="DOCUMENT">Document</option>
            <option value="EXTRACTED_FIELD">Extracted Field</option>
            <option value="REGULATORY_RULE">Regulatory Rule</option>
            <option value="DISCREPANCY">Discrepancy</option>
            <option value="VERIFICATION_RESULT">Verification Result</option>
          </select>

          {/* Severity Selector */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
            <option value="Info">Info</option>
          </select>

          {/* Status Selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="TAMPER_ALERT">Tamper Alert</option>
            <option value="CRITICAL_DEFICIT">Deficit Flagged</option>
            <option value="COMPLIANT">Compliant</option>
          </select>

          {/* Toggle Conflicts Only */}
          <button
            onClick={() => setShowConflictsOnly(!showConflictsOnly)}
            className={`px-2.5 py-1 rounded-lg font-medium border transition-colors flex items-center gap-1.5 ${
              showConflictsOnly
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                : 'bg-background text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Show Conflicts Only
          </button>
        </div>

        {/* Search Input & Reset */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search nodes or citations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background border border-border rounded-lg pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-60"
            />
          </div>

          {(nodeTypeFilter !== 'ALL' ||
            severityFilter !== 'ALL' ||
            statusFilter !== 'ALL' ||
            showConflictsOnly ||
            searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-1"
              title="Reset all active filters"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Graph Content Area: Canvas OR Accessible Table */}
      {viewMode === 'canvas' ? (
        <div className="relative w-full h-[620px] rounded-xl border border-border bg-card overflow-hidden shadow-sm flex">
          {/* Main Interactive Flow Canvas */}
          <div className="flex-1 h-full relative">
            {filteredNodes.length > 0 ? (
              <ReactFlowProvider>
                <GraphCanvasInner
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={handleNodeClick}
                  selectedNodeId={selectedNode?.id || null}
                />
              </ReactFlowProvider>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-card">
                <FileWarning className="w-12 h-12 text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-semibold text-foreground">
                  No Graph Nodes Match Active Filters
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                  Adjust your node type, severity, or status criteria to inspect the underlying evidentiary records.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg shadow-xs hover:bg-primary/90 transition-colors"
                >
                  Reset Graph Filters
                </button>
              </div>
            )}

            {/* Canvas Legend Strip (Bottom-left) */}
            <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-md backdrop-blur-sm z-10 hidden sm:block max-w-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Semantic Relational Legend
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-teal-600 rounded" />
                  <span><strong>supports</strong> (Evidentiary backing)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-slate-500 rounded" />
                  <span><strong>extracted_from</strong> (Neural OCR)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-amber-500 rounded" />
                  <span><strong>governed_by</strong> (Regulatory norm)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-rose-600 border-b border-dashed border-rose-600" />
                  <span className="text-rose-600 font-semibold"><strong>conflicts_with</strong> (Discrepancy)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Slide-Over Node Inspector Drawer */}
          {selectedNode && (
            <div className="w-80 md:w-96 h-full border-l border-border bg-card/95 backdrop-blur-sm p-4 overflow-y-auto flex flex-col justify-between shadow-xl z-20">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {selectedNode.data.nodeType.replace('_', ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-foreground leading-snug mt-0.5">
                      {selectedNode.data.label}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sublabel & Status */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Verification Status:</span>
                  <Badge variant={selectedNode.data.status === 'VERIFIED' ? 'success' : selectedNode.data.status === 'COMPLIANT' ? 'success' : 'danger'}>
                    {selectedNode.data.status}
                  </Badge>
                </div>

                {/* Page Number & Document Citation */}
                {selectedNode.data.sourceDocument && (
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Source Document:</span>
                      {selectedNode.data.pageNumber && (
                        <span className="px-1.5 py-0.5 rounded bg-background font-mono font-semibold text-[11px] text-foreground border border-border">
                          Page {selectedNode.data.pageNumber}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-foreground break-all">
                      {selectedNode.data.sourceDocument}
                    </p>
                  </div>
                )}

                {/* Evidence Details */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Extracted Details & Scrutiny Finding
                  </span>
                  <p className="text-xs text-foreground/90 bg-muted/30 p-2.5 rounded-lg border border-border/60 leading-relaxed">
                    {selectedNode.data.details}
                  </p>
                </div>

                {/* If Discrepancy Node, Show Comparison Box */}
                {selectedNode.data.conflictingValues && (
                  <div className="p-3 rounded-lg bg-rose-50/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Cross-Document Discrepancy Detail
                    </div>
                    <div className="space-y-1 text-rose-900 dark:text-rose-200">
                      <div>
                        <strong>Value A: </strong>
                        <span>{selectedNode.data.conflictingValues.valueA.value}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          (p.{selectedNode.data.conflictingValues.valueA.page || 1})
                        </span>
                      </div>
                      <div>
                        <strong>Value B: </strong>
                        <span>{selectedNode.data.conflictingValues.valueB.value}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          (p.{selectedNode.data.conflictingValues.valueB.page || 1})
                        </span>
                      </div>
                      <div className="pt-1 text-[11px]">
                        <strong>Statutory Rule: </strong>
                        <span>{selectedNode.data.conflictingValues.applicableRule}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                {/* Action Buttons at Footer */}
              <div className="pt-4 border-t border-border space-y-2">
                {selectedNode.data.entityType && (
                  <button
                    onClick={() => handleNavigateToEntity(selectedNode)}
                    className="w-full py-2 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>
                      {selectedNode.data.entityType === 'application' && 'Open Application Dossier'}
                      {selectedNode.data.entityType === 'document' && 'Inspect Document in OCR Pipeline'}
                      {selectedNode.data.entityType === 'rule' && 'Inspect Rulebook Standard'}
                      {selectedNode.data.entityType === 'institution' && 'View Institutional Profile'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveTab('blind-spot-detector');
                    addToast('info', 'Opening Verification Blind-Spot Detector for cross-entity checks.', 'Blind Spot');
                  }}
                  className="w-full py-1.5 px-3 text-xs font-medium border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Check Blind-Spot Coverage</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Accessible Alternative List / Matrix Table View */
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Accessible Evidence Lineage Matrix
              </h3>
              <p className="text-xs text-muted-foreground">
                Tabular representation of all evidentiary dependencies, OCR field extractions, and conflict relationships for screen-readers and audit review.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              Showing <strong>{filteredNodes.length}</strong> evidentiary entities
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Identifier / Label</th>
                  <th className="py-3 px-4">Evidence Citation</th>
                  <th className="py-3 px-4">Regulatory Status</th>
                  <th className="py-3 px-4">Connected Lineage</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredNodes.map((node) => {
                  const data = node.data;
                  const connectedEdges = rawGraphData.edges.filter(
                    (e) => e.source === node.id || e.target === node.id
                  );

                  return (
                    <tr
                      key={node.id}
                      className={`hover:bg-muted/40 transition-colors ${
                        data.nodeType === 'DISCREPANCY'
                          ? 'bg-rose-50/40 dark:bg-rose-950/20'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold px-2 py-0.5 rounded text-[10px] uppercase bg-muted text-muted-foreground">
                          {data.nodeType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground max-w-xs truncate" title={data.label}>
                          {data.label}
                        </div>
                        {data.sublabel && (
                          <div className="text-[11px] text-muted-foreground truncate" title={data.sublabel}>
                            {data.sublabel}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {data.sourceDocument ? (
                          <div className="max-w-[200px]">
                            <div className="font-medium text-foreground truncate" title={data.sourceDocument}>
                              {data.sourceDocument}
                            </div>
                            {data.pageNumber && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Page {data.pageNumber}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Institutional Record</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            data.status === 'VERIFIED'
                              ? 'success'
                              : data.status === 'COMPLIANT'
                              ? 'success'
                              : 'danger'
                          }
                        >
                          {data.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {connectedEdges.slice(0, 3).map((edge) => {
                            const isSource = edge.source === node.id;
                            const otherId = isSource ? edge.target : edge.source;
                            const otherNode = rawGraphData.nodes.find((n) => n.id === otherId);
                            const isConflict = edge.label === 'conflicts_with';

                            return (
                              <span
                                key={edge.id}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                  isConflict
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                                    : 'bg-muted text-muted-foreground border-border'
                                }`}
                                title={`${edge.label} ${otherNode?.data.label || otherId}`}
                              >
                                <span>{edge.label}</span>
                                <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                                <span className="font-bold truncate max-w-[80px]">
                                  {otherNode?.data.label.slice(0, 12)}...
                                </span>
                              </span>
                            );
                          })}
                          {connectedEdges.length > 3 && (
                            <span className="text-[10px] text-muted-foreground self-center">
                              +{connectedEdges.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedNode(node);
                            setViewMode('canvas');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
