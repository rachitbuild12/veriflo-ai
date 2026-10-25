import { MarkerType, Node, Edge } from '@xyflow/react';
import { Application, DocumentVerificationItem, ComplianceRule } from '../../types';
import { InfrastructureEvidence } from '../infrastructure/infrastructureModel';

export type GraphNodeType =
  | 'APPLICATION'
  | 'INSTITUTION'
  | 'DOCUMENT'
  | 'EXTRACTED_FIELD'
  | 'REGULATORY_RULE'
  | 'VERIFICATION_RESULT'
  | 'DISCREPANCY';

export type GraphEdgeType =
  | 'supports'
  | 'extracted_from'
  | 'compared_with'
  | 'governed_by'
  | 'conflicts_with';

export interface ConflictingValueInfo {
  field: string;
  valueA: {
    label: string;
    value: string;
    source: string;
    page?: number;
  };
  valueB: {
    label: string;
    value: string;
    source: string;
    page?: number;
  };
  reason: string;
  applicableRule: string;
  recommendedAction: string;
}

export interface GraphNodeData {
  [key: string]: unknown;
  label: string;
  sublabel?: string;
  nodeType: GraphNodeType;
  status: 'VERIFIED' | 'TAMPER_ALERT' | 'UNVERIFIED' | 'EXPIRED' | 'CRITICAL_DEFICIT' | 'COMPLIANT';
  severity?: 'Critical' | 'Major' | 'Minor' | 'Info';
  confidenceScore?: number;
  sourceDocument?: string;
  pageNumber?: number;
  details: string;
  entityId?: string;
  entityType?: 'application' | 'document' | 'institution' | 'rule';
  conflictingValues?: ConflictingValueInfo;
  isSynthetic?: boolean;
}

export type CustomGraphNode = Node<GraphNodeData, 'custom'>;

export type CustomGraphEdge = Edge<{
  relationship: GraphEdgeType;
  isConflict?: boolean;
  notes?: string;
}>;

export interface GraphData {
  nodes: CustomGraphNode[];
  edges: CustomGraphEdge[];
  hasConflicts: boolean;
  conflictCount: number;
}

/**
 * Assigns clean, non-overlapping source & target handles
 * based on node positions, along with gov-styled arrow markers and labels.
 */
export function assignEdgeHandles(
  nodes: CustomGraphNode[],
  edges: CustomGraphEdge[]
): CustomGraphEdge[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return edges.map((edge) => {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) return edge;

    let sourceHandle = 'source-right';
    let targetHandle = 'target-left';

    const dx = tgt.position.x - src.position.x;
    const dy = tgt.position.y - src.position.y;

    if (Math.abs(dx) <= 80) {
      // Vertically stacked
      if (dy > 0) {
        sourceHandle = 'source-bottom';
        targetHandle = 'target-top';
      } else {
        sourceHandle = 'source-top';
        targetHandle = 'target-bottom';
      }
    } else if (dx < 0) {
      // Target is to the LEFT of Source
      sourceHandle = 'source-left';
      targetHandle = 'target-right';
    } else {
      // Target is to the RIGHT of Source
      sourceHandle = 'source-right';
      targetHandle = 'target-left';
    }

    const isConflict = edge.data?.isConflict || edge.label === 'conflicts_with';
    let strokeColor = '#0D9488';
    let labelBg = '#CCFBF1';
    let labelColor = '#0F766E';

    if (edge.label === 'extracted_from') {
      strokeColor = isConflict ? '#E11D48' : '#64748B';
      labelBg = isConflict ? '#FFE4E6' : '#F1F5F9';
      labelColor = isConflict ? '#BE123C' : '#334155';
    } else if (edge.label === 'compared_with') {
      strokeColor = isConflict ? '#E11D48' : '#8B5CF6';
      labelBg = isConflict ? '#FFE4E6' : '#EDE9FE';
      labelColor = isConflict ? '#BE123C' : '#6D28D9';
    } else if (edge.label === 'governed_by') {
      strokeColor = '#D97706';
      labelBg = '#FEF3C7';
      labelColor = '#B45309';
    } else if (edge.label === 'conflicts_with') {
      strokeColor = '#E11D48';
      labelBg = '#FFE4E6';
      labelColor = '#BE123C';
    } else if (isConflict) {
      strokeColor = '#E11D48';
      labelBg = '#FFE4E6';
      labelColor = '#BE123C';
    }

    return {
      ...edge,
      sourceHandle,
      targetHandle,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: strokeColor,
      },
      labelStyle: {
        fill: labelColor,
        fontWeight: 600,
        fontSize: 10,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      labelBgStyle: {
        fill: labelBg,
        fillOpacity: 0.96,
        stroke: isConflict ? '#FDA4AF' : '#CBD5E1',
        strokeWidth: 1,
        rx: 5,
        ry: 5,
      },
      labelBgPadding: [6, 3] as [number, number],
      style: {
        ...edge.style,
        stroke: strokeColor,
        strokeWidth: edge.style?.strokeWidth || (isConflict ? 2.5 : 1.8),
      },
    };
  });
}

/**
 * Builds deterministic, evidence-backed nodes and directed edges
 * from actual application, document, and rules records.
 */
export function buildEvidenceGraph(
  application: Application | null,
  documents: DocumentVerificationItem[],
  rules: ComplianceRule[],
  demoFacultyMismatch: boolean = false,
  infrastructureEvidence?: InfrastructureEvidence[]
): GraphData {
  if (demoFacultyMismatch || !application) {
    return buildFacultyMismatchDemoGraph();
  }

  const nodes: CustomGraphNode[] = [];
  const edges: CustomGraphEdge[] = [];
  let conflictCount = 0;

  // 1. Institution Node (Root Level, Column 0)
  const instNodeId = `inst-${application.pid}`;
  nodes.push({
    id: instNodeId,
    type: 'custom',
    position: { x: 40, y: 220 },
    data: {
      label: application.institutionName,
      sublabel: `PID: ${application.pid}`,
      nodeType: 'INSTITUTION',
      status: 'VERIFIED',
      details: `${application.institutionType} • ${application.region} AICTE Jurisdiction. Approved intake: ${application.studentStrength || 240} students.`,
      entityId: application.id,
      entityType: 'institution',
      isSynthetic: false,
    },
  });

  // 2. Application Node (Column 1)
  const appNodeId = `app-${application.id}`;
  nodes.push({
    id: appNodeId,
    type: 'custom',
    position: { x: 330, y: 220 },
    data: {
      label: application.applicationNumber,
      sublabel: application.applicationType,
      nodeType: 'APPLICATION',
      status: application.deficienciesCount > 0 ? 'CRITICAL_DEFICIT' : 'VERIFIED',
      severity: application.overallRiskLevel === 'Severe' ? 'Critical' : application.overallRiskLevel === 'High' ? 'Major' : 'Info',
      details: `Academic Year: ${application.academicYear}. Stage: ${application.currentStage}. Deficiencies: ${application.deficienciesCount}. Risk: ${application.overallRiskLevel}.`,
      entityId: application.id,
      entityType: 'application',
      isSynthetic: false,
    },
  });

  edges.push({
    id: `e-${instNodeId}-${appNodeId}`,
    source: instNodeId,
    target: appNodeId,
    label: 'supports',
    animated: false,
    style: { stroke: '#0D9488', strokeWidth: 2 },
    data: { relationship: 'supports', notes: 'Institutional authority sponsors regulatory dossier' },
  });

  // Filter documents associated with this application or PID
  const appDocs = documents.filter(
    (d) =>
      d.applicationId === application.id ||
      d.applicationId === application.pid ||
      (d.extractedEntities && d.extractedEntities['Permanent Institute ID (PID)'] === application.pid) ||
      (d.institutionName && d.institutionName.toLowerCase().includes(application.institutionName.slice(0, 15).toLowerCase()))
  );

  let docY = 60;
  appDocs.forEach((doc, docIdx) => {
    const docNodeId = `doc-${doc.id}`;
    const isDocCompromised =
      doc.verificationStatus === 'Tampering / Forgery Suspected' ||
      doc.verificationStatus === 'Deficiency Flagged';

    // 3. Document Node (Column 2)
    nodes.push({
      id: docNodeId,
      type: 'custom',
      position: { x: 640, y: docY },
      data: {
        label: doc.documentType,
        sublabel: doc.fileName,
        nodeType: 'DOCUMENT',
        status: isDocCompromised ? 'TAMPER_ALERT' : 'VERIFIED',
        severity: isDocCompromised ? 'Critical' : 'Info',
        confidenceScore: doc.aiConfidenceScore,
        sourceDocument: doc.fileName,
        details: `${doc.fileSize} • Uploaded: ${doc.uploadedAt}. AI Scrutiny: ${doc.verificationStatus}. ${doc.scrutinyRemarks}`,
        entityId: doc.id,
        entityType: 'document',
        isSynthetic: doc.isSynthetic || false,
      },
    });

    edges.push({
      id: `e-${docNodeId}-${appNodeId}`,
      source: docNodeId,
      target: appNodeId,
      label: 'supports',
      animated: isDocCompromised,
      style: {
        stroke: isDocCompromised ? '#E11D48' : '#0D9488',
        strokeWidth: isDocCompromised ? 2.5 : 1.8,
        strokeDasharray: isDocCompromised ? '5,5' : undefined,
      },
      data: { relationship: 'supports', isConflict: isDocCompromised, notes: `Evidentiary filing for ${doc.documentType}` },
    });

    // 4. Extracted Field Nodes (Column 3)
    let fieldY = docY - 30;
    const extractedEntries = Object.entries(doc.extractedEntities).slice(0, 3);
    extractedEntries.forEach(([fieldKey, fieldValue], fIdx) => {
      const fieldNodeId = `field-${doc.id}-${fIdx}`;
      const pageNum = (docIdx % 3) + 1;

      nodes.push({
        id: fieldNodeId,
        type: 'custom',
        position: { x: 960, y: fieldY },
        data: {
          label: `${fieldKey}: ${fieldValue}`,
          sublabel: `Source: Page ${pageNum}`,
          nodeType: 'EXTRACTED_FIELD',
          status: 'VERIFIED',
          sourceDocument: doc.fileName,
          pageNumber: pageNum,
          details: `Neural OCR extracted '${fieldValue}' from ${doc.fileName} on page ${pageNum}.`,
          entityId: doc.id,
          entityType: 'document',
        },
      });

      edges.push({
        id: `e-${fieldNodeId}-${docNodeId}`,
        source: fieldNodeId,
        target: docNodeId,
        label: 'extracted_from',
        style: { stroke: '#64748B', strokeWidth: 1.5 },
        data: { relationship: 'extracted_from', notes: `Extracted from page ${pageNum}` },
      });

      fieldY += 65;
    });

    // 5. If document has deficiency findings or tamper alerts, create Discrepancy & Rule Nodes
    if (doc.deficiencyFindings && doc.deficiencyFindings.length > 0) {
      doc.deficiencyFindings.forEach((finding, findIdx) => {
        conflictCount++;
        const discNodeId = `disc-${doc.id}-${findIdx}`;
        nodes.push({
          id: discNodeId,
          type: 'custom',
          position: { x: 1280, y: docY + findIdx * 90 },
          data: {
            label: `Discrepancy: ${finding.clause}`,
            sublabel: finding.severity,
            nodeType: 'DISCREPANCY',
            status: 'CRITICAL_DEFICIT',
            severity: finding.severity,
            sourceDocument: doc.fileName,
            details: finding.message,
            conflictingValues: {
              field: finding.clause,
              valueA: {
                label: 'Observed Value in Document',
                value: finding.message.split('—')[0]?.trim() || 'Deficit Observed',
                source: doc.fileName,
                page: 1,
              },
              valueB: {
                label: 'Statutory Standard',
                value: 'Approval Process Handbook Norm',
                source: finding.clause,
                page: 1,
              },
              reason: finding.message,
              applicableRule: finding.clause,
              recommendedAction: 'Provide compliant regulatory clearance or updated affidavit.',
            },
            entityId: doc.id,
            entityType: 'document',
          },
        });

        edges.push({
          id: `e-${discNodeId}-${docNodeId}`,
          source: discNodeId,
          target: docNodeId,
          label: 'conflicts_with',
          animated: true,
          style: { stroke: '#E11D48', strokeWidth: 2.5, strokeDasharray: '6,6' },
          data: { relationship: 'conflicts_with', isConflict: true, notes: `Breach of clause ${finding.clause}` },
        });

        // Regulatory Rule Node for this clause
        const ruleMatch = rules.find((r) => r.clauseCode === finding.clause || r.id === finding.clause);
        if (ruleMatch) {
          const ruleNodeId = `rule-${ruleMatch.id}`;
          if (!nodes.some((n) => n.id === ruleNodeId)) {
            nodes.push({
              id: ruleNodeId,
              type: 'custom',
              position: { x: 1280, y: docY - 70 },
              data: {
                label: `${ruleMatch.clauseCode}: ${ruleMatch.title}`,
                sublabel: `${ruleMatch.category} • Amended ${ruleMatch.lastAmended}`,
                nodeType: 'REGULATORY_RULE',
                status: 'COMPLIANT',
                details: ruleMatch.description,
                entityId: ruleMatch.id,
                entityType: 'rule',
              },
            });
          }

          edges.push({
            id: `e-${discNodeId}-${ruleNodeId}`,
            source: discNodeId,
            target: ruleNodeId,
            label: 'governed_by',
            style: { stroke: '#F59E0B', strokeWidth: 2 },
            data: { relationship: 'governed_by', notes: `Statutory mandate ${ruleMatch.clauseCode}` },
          });
        }
      });
    }

    docY += 210;
  });

  // 6. Application Deficiency Notices (if any)
  if (application.deficiencyNotices && application.deficiencyNotices.length > 0) {
    application.deficiencyNotices.forEach((def, defIdx) => {
      conflictCount++;
      const defNodeId = `app-def-${def.id}`;
      nodes.push({
        id: defNodeId,
        type: 'custom',
        position: { x: 1280, y: 380 + defIdx * 90 },
        data: {
          label: `Notice: ${def.clauseCode}`,
          sublabel: `${def.category} (${def.severity})`,
          nodeType: 'DISCREPANCY',
          status: 'CRITICAL_DEFICIT',
          severity: def.severity,
          details: def.issueDescription,
          conflictingValues: {
            field: def.clauseCode,
            valueA: {
              label: 'Reported Defect',
              value: def.issueDescription,
              source: application.applicationNumber,
            },
            valueB: {
              label: 'Resolution Status',
              value: def.status,
              source: `Deadline: ${def.complianceDeadline}`,
            },
            reason: def.issueDescription,
            applicableRule: def.clauseCode,
            recommendedAction: 'Institute response required or hearing convened.',
          },
          entityId: application.id,
          entityType: 'application',
        },
      });

      edges.push({
        id: `e-${defNodeId}-${appNodeId}`,
        source: defNodeId,
        target: appNodeId,
        label: 'conflicts_with',
        animated: true,
        style: { stroke: '#E11D48', strokeWidth: 2.5, strokeDasharray: '6,6' },
        data: { relationship: 'conflicts_with', isConflict: true, notes: `Breach: ${def.clauseCode}` },
      });
    });
  }

  // 6b. Attached Infrastructure Evidence Nodes (Visual AI & Blueprints)
  if (infrastructureEvidence && infrastructureEvidence.length > 0) {
    const matchingInfra = infrastructureEvidence.filter(
      (e) => e.applicationId === application.id || e.pid === application.pid
    );

    matchingInfra.forEach((infra, iIdx) => {
      const infraNodeId = `infra-${infra.id}`;
      const hasAnomaly =
        infra.qualityIssues.length > 0 || infra.metadataAnomalies.length > 0 || infra.isDuplicate;
      if (hasAnomaly) conflictCount++;

      nodes.push({
        id: infraNodeId,
        type: 'custom',
        position: { x: 640, y: docY + iIdx * 110 },
        data: {
          label: `Visual: ${infra.title}`,
          sublabel: `${infra.evidenceType} (${infra.facilityType})`,
          nodeType: 'DOCUMENT',
          status: hasAnomaly ? 'TAMPER_ALERT' : 'VERIFIED',
          severity: hasAnomaly ? 'Major' : 'Info',
          confidenceScore: infra.aiConfidence,
          sourceDocument: infra.fileName,
          details: `Facility: ${infra.facilityType}. Quality: ${infra.qualityIssues.join(', ') || 'Clean'}. Metadata: ${infra.metadataAnomalies.join(', ') || 'Valid'}. SHA-256: ${infra.sha256Hash.substring(0, 14)}...`,
          entityId: infra.id,
          entityType: 'document',
          isSynthetic: true,
        },
      });

      edges.push({
        id: `e-${infraNodeId}-${appNodeId}`,
        source: infraNodeId,
        target: appNodeId,
        label: hasAnomaly ? 'conflicts_with' : 'supports',
        animated: hasAnomaly,
        style: {
          stroke: hasAnomaly ? '#E11D48' : '#0D9488',
          strokeWidth: hasAnomaly ? 2.5 : 1.8,
          strokeDasharray: hasAnomaly ? '5,5' : undefined,
        },
        data: {
          relationship: hasAnomaly ? 'conflicts_with' : 'supports',
          isConflict: hasAnomaly,
          notes: `Visual evidence for ${infra.facilityType}`,
        },
      });
    });
  }

  // 7. Verification Result Verdict Node (Column 5)
  const isApplicationFlagged = application.deficienciesCount > 0 || conflictCount > 0;
  const resultNodeId = `result-${application.id}`;
  nodes.push({
    id: resultNodeId,
    type: 'custom',
    position: { x: 1600, y: 220 },
    data: {
      label: `Scrutiny Verdict: ${isApplicationFlagged ? 'Deficiencies Identified' : 'Compliant Dossier'}`,
      sublabel: `Status: ${application.status}`,
      nodeType: 'VERIFICATION_RESULT',
      status: isApplicationFlagged ? 'CRITICAL_DEFICIT' : 'VERIFIED',
      severity: isApplicationFlagged ? 'Critical' : 'Info',
      details: `Application currently at '${application.currentStage}'. Active deficiencies: ${application.deficienciesCount}. Overall risk profile: ${application.overallRiskLevel}.`,
      entityId: application.id,
      entityType: 'application',
      isSynthetic: false,
    },
  });

  edges.push({
    id: `e-${appNodeId}-${resultNodeId}`,
    source: appNodeId,
    target: resultNodeId,
    label: 'supports',
    animated: isApplicationFlagged,
    style: {
      stroke: isApplicationFlagged ? '#E11D48' : '#10B981',
      strokeWidth: 2.5,
    },
    data: { relationship: 'supports', isConflict: isApplicationFlagged, notes: 'Evaluated outcome of dossier scrutiny' },
  });

  return {
    nodes,
    edges: assignEdgeHandles(nodes, edges),
    hasConflicts: conflictCount > 0,
    conflictCount,
  };
}

/**
 * Builds the clearly labeled synthetic demonstration case
 * proving a Faculty-Name & Cadre Mismatch across multiple official documents.
 */
export function buildFacultyMismatchDemoGraph(): GraphData {
  const nodes: CustomGraphNode[] = [];
  const edges: CustomGraphEdge[] = [];

  // Node 1: Institution
  nodes.push({
    id: 'inst-apex',
    type: 'custom',
    position: { x: 40, y: 240 },
    data: {
      label: 'Apex Horizon Institute of Technology [Synthetic]',
      sublabel: 'Permanent Institute ID: 1-4359812451',
      nodeType: 'INSTITUTION',
      status: 'VERIFIED',
      details: 'Self-Financing Technical Institute • Western Region (WRO). Approved annual intake: 240 seats.',
      entityId: 'APP-2025-01',
      entityType: 'institution',
      isSynthetic: true,
    },
  });

  // Node 2: Application Dossier
  nodes.push({
    id: 'app-apex-eoa',
    type: 'custom',
    position: { x: 330, y: 240 },
    data: {
      label: 'AICTE-2025-WRO-10928 (EoA Dossier)',
      sublabel: 'Extension of Approval (EoA 2025-26)',
      nodeType: 'APPLICATION',
      status: 'CRITICAL_DEFICIT',
      severity: 'Critical',
      details: 'Claims 52 Active Faculty members including Department Head Dr. Rajesh Kumar Sharma.',
      entityId: 'APP-2025-01',
      entityType: 'application',
      isSynthetic: true,
    },
  });

  edges.push({
    id: 'e-inst-app',
    source: 'inst-apex',
    target: 'app-apex-eoa',
    label: 'supports',
    style: { stroke: '#0D9488', strokeWidth: 2 },
    data: { relationship: 'supports', notes: 'Institution submits annual Extension of Approval dossier' },
  });

  // Node 3: Document 1 - Affiliation Cadre List
  nodes.push({
    id: 'doc-affil-roster',
    type: 'custom',
    position: { x: 640, y: 80 },
    data: {
      label: 'University Affiliation Letter & Endorsed Cadre List',
      sublabel: 'AFFIL/MU/2024/ENGG-9021.pdf',
      nodeType: 'DOCUMENT',
      status: 'VERIFIED',
      confidenceScore: 94.2,
      sourceDocument: 'AFFIL/MU/2024/ENGG-9021.pdf',
      pageNumber: 2,
      details: 'Official letter from Affiliating University confirming endorsed teacher appointments.',
      entityId: 'DOC-01',
      entityType: 'document',
      isSynthetic: true,
    },
  });

  edges.push({
    id: 'e-doc1-app',
    source: 'doc-affil-roster',
    target: 'app-apex-eoa',
    label: 'supports',
    style: { stroke: '#0D9488', strokeWidth: 1.8 },
    data: { relationship: 'supports', notes: 'Endorses faculty roster for 2024-25 cycle' },
  });

  // Node 4: Document 2 - Statutory Form-16 & EPFO Return
  nodes.push({
    id: 'doc-form16-salary',
    type: 'custom',
    position: { x: 640, y: 400 },
    data: {
      label: 'Statutory Form-16 & EPFO Salary Statement',
      sublabel: 'FORM16_EPFO_AY2024-25_SECURE.pdf',
      nodeType: 'DOCUMENT',
      status: 'TAMPER_ALERT',
      severity: 'Critical',
      confidenceScore: 68.0,
      sourceDocument: 'FORM16_EPFO_AY2024-25_SECURE.pdf',
      pageNumber: 4,
      details: 'Income tax Form-16 and Employees Provident Fund return covering core faculty salaries.',
      entityId: 'DOC-02',
      entityType: 'document',
      isSynthetic: true,
    },
  });

  edges.push({
    id: 'e-doc2-app',
    source: 'doc-form16-salary',
    target: 'app-apex-eoa',
    label: 'supports',
    animated: true,
    style: { stroke: '#E11D48', strokeWidth: 2.5, strokeDasharray: '5,5' },
    data: { relationship: 'supports', isConflict: true, notes: 'Fails cross-verification with university cadre' },
  });

  // Node 5: Extracted Field A (University Roster)
  nodes.push({
    id: 'field-name-university',
    type: 'custom',
    position: { x: 960, y: 80 },
    data: {
      label: 'Faculty: "Dr. Rajesh Kumar Sharma"',
      sublabel: 'Designation: Professor & Head (CSE) • Page 2',
      nodeType: 'EXTRACTED_FIELD',
      status: 'VERIFIED',
      sourceDocument: 'AFFIL/MU/2024/ENGG-9021.pdf',
      pageNumber: 2,
      details: 'Extracted from University Endorsement Table (Page 2). Ph.D. in Computer Engineering (2012).',
      entityId: 'DOC-01',
      entityType: 'document',
      isSynthetic: true,
    },
  });

  edges.push({
    id: 'e-field1-doc1',
    source: 'field-name-university',
    target: 'doc-affil-roster',
    label: 'extracted_from',
    style: { stroke: '#64748B', strokeWidth: 1.5 },
    data: { relationship: 'extracted_from', notes: 'Extracted from Table 3 on Page 2' },
  });

  // Node 6: Extracted Field B (Conflicting Form-16)
  nodes.push({
    id: 'field-name-tax',
    type: 'custom',
    position: { x: 960, y: 400 },
    data: {
      label: 'Faculty: "Prof. R. K. Verma"',
      sublabel: 'PAN/EPFO Payee: R.K. Verma • Page 4',
      nodeType: 'EXTRACTED_FIELD',
      status: 'CRITICAL_DEFICIT',
      severity: 'Critical',
      sourceDocument: 'FORM16_EPFO_AY2024-25_SECURE.pdf',
      pageNumber: 4,
      details: 'Extracted from Treasury Tax Disbursement Schedule (Page 4). PAN: ABCPV1092M.',
      entityId: 'DOC-02',
      entityType: 'document',
      isSynthetic: true,
    },
  });

  edges.push({
    id: 'e-field2-doc2',
    source: 'field-name-tax',
    target: 'doc-form16-salary',
    label: 'extracted_from',
    animated: true,
    style: { stroke: '#E11D48', strokeWidth: 2 },
    data: { relationship: 'extracted_from', isConflict: true, notes: 'Extracted from Payee Row 14 on Page 4' },
  });

  // Node 7: Regulatory Rule
  nodes.push({
    id: 'rule-cad-norm',
    type: 'custom',
    position: { x: 1280, y: 150 },
    data: {
      label: 'RULE-CAD-006: Faculty Identity & Cadre Integrity',
      sublabel: 'AICTE APH Ch.7 Clause 2.1',
      nodeType: 'REGULATORY_RULE',
      status: 'COMPLIANT',
      details: 'All faculty members listed in the application must match affiliating university records and official tax/salary filings.',
      entityId: 'RULE-CAD-006',
      entityType: 'rule',
      isSynthetic: true,
    },
  });

  // Node 8: Highlighted Discrepancy Node (Central Conflict)
  nodes.push({
    id: 'disc-faculty-mismatch',
    type: 'custom',
    position: { x: 1280, y: 320 },
    data: {
      label: 'Conflict: Faculty Name & Identity Mismatch',
      sublabel: 'Severe Discrepancy • AICTE APH Clause 2.1',
      nodeType: 'DISCREPANCY',
      status: 'CRITICAL_DEFICIT',
      severity: 'Critical',
      sourceDocument: 'AFFIL/MU/2024/ENGG-9021.pdf & FORM16_EPFO_AY2024-25_SECURE.pdf',
      pageNumber: 2,
      details: 'University Endorsement Roster cites "Dr. Rajesh Kumar Sharma", while statutory Form-16 payroll cites "Prof. R. K. Verma" for the same Senior Professor post.',
      conflictingValues: {
        field: 'Faculty Member Identity & Cadre Assignment',
        valueA: {
          label: 'University Affiliation Roster',
          value: 'Dr. Rajesh Kumar Sharma (Ph.D. Comp. Engg)',
          source: 'AFFIL/MU/2024/ENGG-9021.pdf',
          page: 2,
        },
        valueB: {
          label: 'Form-16 IT & EPFO Salary Return',
          value: 'Prof. R. K. Verma (PAN: ABCPV1092M)',
          source: 'FORM16_EPFO_AY2024-25_SECURE.pdf',
          page: 4,
        },
        reason:
          'Identity collision detected between university selection minutes and statutory salary filings. Indicates potential ghost faculty submission or unauthorized teacher substitution without university concurrence.',
        applicableRule: 'AICTE Approval Process Handbook (APH Ch.7 Clause 2.1 & Clause 3.4 - Teacher Identity Verification)',
        recommendedAction:
          'Issue Immediate Show-Cause Deficiency Notice. Convene Level 2 Scrutiny Hearing requiring biometric Aadhaar-linked PAN verification and university approval endorsement.',
      },
      entityId: 'DOC-02',
      entityType: 'document',
      isSynthetic: true,
    },
  });

  // Edge 8a: Field 1 compared with Field 2
  edges.push({
    id: 'e-field1-field2-compare',
    source: 'field-name-university',
    target: 'field-name-tax',
    label: 'compared_with',
    animated: true,
    style: { stroke: '#E11D48', strokeWidth: 2.5, strokeDasharray: '4,4' },
    data: { relationship: 'compared_with', isConflict: true, notes: 'Automated entity alignment caught name divergence' },
  });

  // Edge 8b: Field 2 conflicts with Discrepancy
  edges.push({
    id: 'e-field2-disc',
    source: 'field-name-tax',
    target: 'disc-faculty-mismatch',
    label: 'conflicts_with',
    animated: true,
    style: { stroke: '#E11D48', strokeWidth: 3, strokeDasharray: '6,6' },
    data: { relationship: 'conflicts_with', isConflict: true, notes: 'Fails cross-check against university roster' },
  });

  // Edge 8c: Discrepancy governed by Rule
  edges.push({
    id: 'e-disc-rule',
    source: 'disc-faculty-mismatch',
    target: 'rule-cad-norm',
    label: 'governed_by',
    style: { stroke: '#F59E0B', strokeWidth: 2 },
    data: { relationship: 'governed_by', notes: 'Violates AICTE teacher endorsement norm' },
  });

  // Node 9: Verification Result
  nodes.push({
    id: 'result-scrutiny-flagged',
    type: 'custom',
    position: { x: 1600, y: 320 },
    data: {
      label: 'AI Scrutiny Verdict: Deficiency Flagged',
      sublabel: 'Confidence: 41.5% • Level 2 Committee Escalation',
      nodeType: 'VERIFICATION_RESULT',
      status: 'CRITICAL_DEFICIT',
      severity: 'Critical',
      details: 'Automated dossier sanction withheld due to unresolved faculty identity conflict.',
      entityId: 'APP-2025-01',
      entityType: 'application',
      isSynthetic: true,
    },
  });

  edges.push({
    id: 'e-disc-result',
    source: 'disc-faculty-mismatch',
    target: 'result-scrutiny-flagged',
    label: 'supports',
    animated: true,
    style: { stroke: '#E11D48', strokeWidth: 2.5 },
    data: { relationship: 'supports', isConflict: true, notes: 'Drives overall rejection / deficiency verdict' },
  });

  return {
    nodes,
    edges: assignEdgeHandles(nodes, edges),
    hasConflicts: true,
    conflictCount: 1,
  };
}
