/**
 * Veriflo AI - Official GovTech Regulatory PDF Report Generator
 * 
 * Generates official AICTE regulatory scrutiny orders and Extension of Approval (EoA) reports
 * from live, shared application and verification data.
 */

import { jsPDF } from 'jspdf';
import {
  Application,
  DocumentVerificationItem,
  VerificationReport,
} from '../types';
import { DocumentClaim, BlindSpotRecord, VerificationCoverageSummary } from '../components/blindspot/blindSpotModel';
import { ClaimedFacility, InfrastructureEvidence, MissingEvidenceItem } from '../components/infrastructure/infrastructureModel';

export interface ReportGenerationPayload {
  report: VerificationReport;
  application: Application;
  documents: DocumentVerificationItem[];
  claims: DocumentClaim[];
  blindSpots: BlindSpotRecord[];
  coverageSummary?: VerificationCoverageSummary;
  facilities?: ClaimedFacility[];
  infrastructureEvidence?: InfrastructureEvidence[];
  missingEvidence?: MissingEvidenceItem[];
  scenarioDetails?: {
    name: string;
    proposedIntake: number;
    baselineIntake: number;
    projectedDeficits: string[];
  };
}

export function generateRegulatoryPDF(payload: ReportGenerationPayload): jsPDF {
  const {
    report,
    application,
    documents,
    claims,
    blindSpots,
    facilities = [],
    infrastructureEvidence = [],
    missingEvidence = [],
    scenarioDetails,
  } = payload;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 14;
      renderPageHeader();
    }
  };

  const renderPageHeader = () => {
    doc.setFillColor(15, 23, 42); // Navy 900
    doc.rect(0, 0, pageWidth, 6, 'F');
    y = Math.max(y, 14);
  };

  // ==========================================
  // PAGE 1: OFFICIAL GOVTECH MASTHEAD & SUMMARY
  // ==========================================
  renderPageHeader();

  // Government Emblem & Title Block
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('ALL INDIA COUNCIL FOR TECHNICAL EDUCATION', pageWidth / 2, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('(A Statutory Body of the Government of India, Ministry of Education)', pageWidth / 2, y + 13, { align: 'center' });
  doc.text('Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070 • www.aicte.gov.in', pageWidth / 2, y + 17, { align: 'center' });

  // Synthetic Demonstration Notice
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.rect(margin + 10, y + 21, contentWidth - 20, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text('[SYNTHETIC DEMO EVALUATION RECORD - SMART INDIA HACKATHON VERIFLO AI PROTOTYPE]', pageWidth / 2, y + 25, { align: 'center' });

  y += 36;

  // Order Title & File No
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(13, 148, 136); // Teal 600
  doc.text(`REGULATORY SCRUTINY ORDER: ${report.reportType.toUpperCase()}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`File Reference No: ${report.reportNumber}`, margin, y + 5);
  doc.text(`Date of Scrutiny: ${report.generatedDate}`, pageWidth - margin, y + 5, { align: 'right' });

  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // ==========================================
  // SECTION 1: INSTITUTION & APPLICATION DOSSIER
  // ==========================================
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. INSTITUTION & APPLICATION DOSSIER METADATA', margin + 3, y + 4.2);
  y += 9;

  const appMeta = [
    ['Institution Name', application.institutionName],
    ['Permanent Institute ID (PID)', application.pid],
    ['Application Number', application.applicationNumber],
    ['Jurisdiction Region', `${application.region} AICTE Jurisdiction`],
    ['Academic Scrutiny Cycle', application.academicYear],
    ['Approval Application Type', application.applicationType],
    ['Current Scrutiny Stage', application.currentStage],
    ['Regulatory Dossier Status', application.status],
    ['Assessed AI Risk Profile', `${application.overallRiskLevel} Risk (${application.deficienciesCount} Deficiencies Recorded)`],
    ['Sanctioned Intake Total', `${application.studentStrength || 240} Seats (${application.programs.length} Approved Programs)`],
  ];

  doc.setFontSize(7.5);
  appMeta.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`${k}:`, margin + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(v), margin + 65, y);
    y += 4.5;
  });

  y += 3;

  // ==========================================
  // SECTION 2: REGULATORY VERDICT & SUMMARY METRICS
  // ==========================================
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. SCRUTINY EVALUATION OUTCOME & COMPLIANCE METRICS', margin + 3, y + 4.2);
  y += 9;

  // Verdict Banner
  const isApproved = report.verdict.includes('Recommended for Approval');
  const isRectify = report.verdict.includes('15-day');
  doc.setFillColor(isApproved ? 236 : isRectify ? 254 : 255, isApproved ? 253 : isRectify ? 243 : 241, isApproved ? 245 : isRectify ? 199 : 242);
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(isApproved ? 16 : isRectify ? 180 : 225, isApproved ? 149 : isRectify ? 83 : 29, isApproved ? 97 : isRectify ? 9 : 72);
  doc.text(`Official Determination: ${report.verdict}`, margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Signatory: ${report.evaluatorName} • Designation: ${report.evaluatorDesignation}`, margin + 4, y + 9.5);
  y += 16;

  // Summary Metrics Columns
  const metricsBoxWidth = contentWidth / 4;
  const metricsData = [
    { label: 'Norms Audited', val: report.summaryMetrics.totalNormsChecked },
    { label: 'Norms Satisfied', val: report.summaryMetrics.normsSatisfied },
    { label: 'Minor Deficits', val: report.summaryMetrics.minorDeficiencies },
    { label: 'Critical Breaches', val: report.summaryMetrics.criticalViolations },
  ];

  metricsData.forEach((m, idx) => {
    const boxX = margin + idx * metricsBoxWidth;
    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, y, metricsBoxWidth - 2, 11, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(boxX, y, metricsBoxWidth - 2, 11, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label.toUpperCase(), boxX + (metricsBoxWidth - 2) / 2, y + 4, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(idx === 1 ? 16 : idx >= 2 && m.val > 0 ? 225 : 15, idx === 1 ? 149 : idx >= 2 && m.val > 0 ? 29 : 23, idx === 1 ? 97 : idx >= 2 && m.val > 0 ? 72 : 42);
    doc.text(String(m.val), boxX + (metricsBoxWidth - 2) / 2, y + 9.5, { align: 'center' });
  });

  y += 16;

  // ==========================================
  // SECTION 3: SUBMITTED DOCUMENTS INVENTORY
  // ==========================================
  checkPageOverflow(30);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`3. SUBMITTED EVIDENCE DOSSIER INVENTORY (${documents.length} Records)`, margin + 3, y + 4.2);
  y += 8;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text('DOCUMENT TYPE', margin + 2, y + 3.5);
  doc.text('FILE NAME / HASH', margin + 55, y + 3.5);
  doc.text('STATUS', margin + 125, y + 3.5);
  doc.text('CONF.', margin + 168, y + 3.5);
  y += 6;

  documents.slice(0, 7).forEach((docItem) => {
    checkPageOverflow(8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(docItem.documentType.substring(0, 32), margin + 2, y + 2.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${docItem.fileName.substring(0, 30)} (SHA: ${docItem.sha256Hash ? docItem.sha256Hash.substring(0, 10) : 'N/A'}...)`, margin + 55, y + 2.5);
    doc.setTextColor(docItem.verificationStatus.includes('Verified') ? 16 : 225, docItem.verificationStatus.includes('Verified') ? 149 : 29, docItem.verificationStatus.includes('Verified') ? 97 : 72);
    doc.text(docItem.verificationStatus.substring(0, 24), margin + 125, y + 2.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${docItem.aiConfidenceScore}%`, margin + 168, y + 2.5);
    y += 5;
  });

  y += 4;

  // ==========================================
  // PAGE 2: EXTRACTED EVIDENCE, CLAIMS & DEFICIENCIES
  // ==========================================
  checkPageOverflow(40);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. STATUTORY CLAIMS, EVIDENCE REFERENCES & DISCREPANCY AUDIT', margin + 3, y + 4.2);
  y += 8;

  // Claims list
  const appClaims = claims.filter(
    (c) => c.applicationId === application.id || c.pid === application.pid
  );

  if (appClaims.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No active itemized claims registered for this institutional dossier.', margin + 2, y + 3);
    y += 6;
  } else {
    appClaims.slice(0, 5).forEach((claim) => {
      checkPageOverflow(14);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${claim.claimType}: ${claim.claimedValue}`, margin + 3, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Source Document: ${claim.sourceDocumentName} (Page ${claim.pageNumber || 1}) • Status: ${claim.status}`, margin + 3, y + 7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Findings: ${claim.statusReason}`, margin + 3, y + 10.5);

      y += 14;
    });
  }

  y += 2;

  // ==========================================
  // SECTION 5: VERIFICATION BLIND SPOTS & SOURCE AUDIT
  // ==========================================
  checkPageOverflow(35);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('5. VERIFICATION BLIND SPOTS & SOURCE UNREACHABILITY AUDIT', margin + 3, y + 4.2);
  y += 8;

  const appSpots = blindSpots.filter(
    (b) => b.applicationId === application.id || b.pid === application.pid
  );

  if (appSpots.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 149, 97);
    doc.text('✓ Zero unmitigated blind spots detected. All claims reconciled with verified authorities.', margin + 2, y + 3);
    y += 7;
  } else {
    appSpots.slice(0, 3).forEach((bs) => {
      checkPageOverflow(18);
      doc.setFillColor(254, 242, 242); // Rose 50
      doc.roundedRect(margin, y, contentWidth, 16, 1, 1, 'F');
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(margin, y, contentWidth, 16, 1, 1, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(190, 18, 60); // Rose 700
      doc.text(`[${bs.type}] ${bs.title} (${bs.severity} Priority)`, margin + 3, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Affected Claim: ${bs.affectedClaim} • Source: ${bs.missingSourceOrPortal}`, margin + 3, y + 7.5);
      doc.text(`What Remains Unverified: ${bs.whatRemainsUnverified.substring(0, 115)}...`, margin + 3, y + 10.5);
      doc.setTextColor(13, 148, 136);
      doc.text(`Recommended Action: ${bs.nextRecommendedAction.substring(0, 115)}...`, margin + 3, y + 13.5);

      y += 18;
    });
  }

  y += 2;

  // ==========================================
  // SECTION 6: INFRASTRUCTURE & VISUAL AUDITING
  // ==========================================
  if (facilities.length > 0 || infrastructureEvidence.length > 0) {
    checkPageOverflow(30);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('6. PHYSICAL INFRASTRUCTURE EVIDENCE & CAD REVIEW', margin + 3, y + 4.2);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Total Claimed Facilities Audited: ${facilities.length} | Supporting Visual Files: ${infrastructureEvidence.length} | Missing Statutory Docs: ${missingEvidence.length}`, margin + 2, y + 2);
    y += 6;

    // List sample facility claims
    facilities.slice(0, 3).forEach((f) => {
      checkPageOverflow(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(`• ${f.facilityName} (${f.facilityType})`, margin + 2, y + 2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Claimed: ${f.claimedAreaSqM} sq.m (${f.roomNumber} - ${f.buildingBlock}) | Status: ${f.status} | Clause: ${f.complianceClause}`, margin + 5, y + 5);
      y += 8;
    });
  }

  // ==========================================
  // SECTION 7: SCENARIO PROJECTION (IF AVAILABLE)
  // ==========================================
  if (scenarioDetails) {
    checkPageOverflow(25);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`7. COMPLIANCE TIME MACHINE SIMULATION: ${scenarioDetails.name.toUpperCase()}`, margin + 3, y + 4.2);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Approved Intake Shift: ${scenarioDetails.baselineIntake} -> ${scenarioDetails.proposedIntake} Seats (+${scenarioDetails.proposedIntake - scenarioDetails.baselineIntake} Proposed Delta)`, margin + 2, y + 2);
    y += 5;

    scenarioDetails.projectedDeficits.forEach((def) => {
      checkPageOverflow(6);
      doc.setTextColor(190, 18, 60);
      doc.text(`  ! Projected Impact: ${def}`, margin + 4, y + 2);
      y += 4.5;
    });
  }

  // ==========================================
  // FINAL SIGN-OFF & STATUTORY CAVEAT
  // ==========================================
  checkPageOverflow(35);
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('STATUTORY REGULATORY CAVEAT & DISCLAIMER:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'A local OCR match, valid-looking PDF, or AI response does not constitute independent authority verification. Claims not verified through authorized registries require manual scrutiny or physical EVC inspection. Visual variations between photographs do not independently establish fraud.',
    margin,
    y + 4,
    { maxWidth: contentWidth }
  );

  y += 12;

  // Digital Signature Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - margin - 75, y, 75, 18, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth - margin - 75, y, 75, 18, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('DIGITALLY SIGNED & SEALED', pageWidth - margin - 72, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(`Signatory: ${report.evaluatorName}`, pageWidth - margin - 72, y + 8);
  doc.text(`Designation: ${report.evaluatorDesignation}`, pageWidth - margin - 72, y + 11);
  doc.text('DSC Class 3 Token: SHA256:7a9c8e104f28...', pageWidth - margin - 72, y + 14);

  // Bottom footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Veriflo AI • GovTech Regulatory Verification Engine • Confidential Scrutiny Dossier • Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}
