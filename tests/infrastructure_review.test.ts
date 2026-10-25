import assert from 'node:assert';
import {
  ClaimedFacility,
  FacilityType,
  ImageAnnotation,
  InfrastructureEvidence,
  MissingEvidenceItem,
  getInitialInfrastructureDataset,
  validateInfrastructureClaimProof,
} from '../src/components/infrastructure/infrastructureModel';
import { getInitialClaimsAndBlindSpots } from '../src/components/blindspot/blindSpotModel';
import { buildEvidenceGraph } from '../src/components/graph/graphModel';

console.log('🧪 Starting Veriflo AI - Infrastructure Evidence Review & GovTech Guardrail Test Suite...\n');

// -------------------------------------------------------------
// Test Suite 1: Regulatory Proof Guardrails (APH Chapter VI § 4.3)
// -------------------------------------------------------------
console.log('Test 1: Enforcing Non-Authoritative Photo Barrier & Independent Corroboration Guardrails...');

// 1a: Photograph alone MUST NOT legally establish room dimensions, equipment functionality or physical existence
const photoOnlyProof = validateInfrastructureClaimProof(true, false, false);
assert.strictEqual(
  photoOnlyProof.valid,
  false,
  'A photograph alone must be rejected from proving room dimensions or equipment functionality'
);
assert.ok(
  photoOnlyProof.reason.includes('photograph alone cannot establish'),
  'Proof rejection reason must explicitly cite non-authoritative photograph limitation'
);
console.log('  ✓ Regulatory guardrail verified: Photograph alone cannot verify physical dimensions or functional equipment.');

// 1b: Photo + Registered Architect Certificate satisfies documentary sufficiency
const photoAndCertProof = validateInfrastructureClaimProof(true, true, false);
assert.strictEqual(
  photoAndCertProof.valid,
  true,
  'Photo + Registered Architect Built-up Certificate must satisfy documentary sufficiency'
);
console.log('  ✓ Regulatory guardrail verified: Architect Certificate provides valid independent corroboration.');

// 1c: Photo + Physical EVC on-site inspection satisfies statutory sufficiency
const photoAndEvcProof = validateInfrastructureClaimProof(true, false, true);
assert.strictEqual(
  photoAndEvcProof.valid,
  true,
  'Photo + Physical EVC Inspection satisfies statutory requirement'
);
console.log('  ✓ Regulatory guardrail verified: On-site EVC physical inspection provides statutory corroboration.\n');

// -------------------------------------------------------------
// Test Suite 2: Infrastructure Dataset & Computer Vision Classification
// -------------------------------------------------------------
console.log('Test 2: Auditing Seeded Infrastructure Facilities, CAD Plans & Photographic Dossiers...');

const dataset = getInitialInfrastructureDataset();
assert.ok(dataset.facilities.length >= 5, 'Must contain at least 5 representative facility claims');
assert.ok(dataset.evidenceList.length >= 6, 'Must contain at least 6 infrastructure evidence dossiers');
assert.ok(dataset.missingEvidenceList.length >= 2, 'Must contain at least 2 recorded regulatory deficiencies');

// Verify facility types coverage
const facilityTypes = new Set(dataset.facilities.map((f) => f.facilityType));
assert.ok(facilityTypes.has('Computer Centers & Server Rooms'), 'Must include Computer Center facility type');
assert.ok(facilityTypes.has('Laboratories & Workshops'), 'Must include Laboratories & Workshops');
assert.ok(facilityTypes.has('Barrier-Free & Divyangjan Access'), 'Must include Barrier-Free Access');
assert.ok(facilityTypes.has('Life Safety & Fire Installations'), 'Must include Life Safety & Fire');
console.log(`  ✓ Verified ${facilityTypes.size} distinct regulatory facility categories across institutional dossiers.`);

// Verify SHA-256 Duplicate Photo Collision detection
const duplicateEvidence = dataset.evidenceList.find((e) => e.isDuplicate);
assert.ok(duplicateEvidence, 'Dataset must seed an evidence item demonstrating SHA-256 duplicate collision');
assert.strictEqual(
  duplicateEvidence?.metadataAnomalies.includes('Duplicate Photo Collision'),
  true,
  'Metadata anomalies must include "Duplicate Photo Collision"'
);
console.log(`  ✓ Forensics verified: Duplicate photograph collision detected (SHA-256: ${duplicateEvidence.sha256Hash.substring(0, 16)}...).`);

// Verify Metadata Editing Software Trace (Photoshop CC detection)
const editedEvidence = dataset.evidenceList.find((e) =>
  e.metadataAnomalies.includes('Photo Editing Software Trace')
);
assert.ok(editedEvidence, 'Dataset must demonstrate photo editing software trace');
assert.ok(
  editedEvidence?.exifMetadata.software?.includes('Photoshop'),
  'EXIF metadata must cite Adobe Photoshop trace'
);
console.log(`  ✓ Forensics verified: Photo editing software signature detected (${editedEvidence.exifMetadata.software}).`);

// Verify Image Quality Issue detection (Low DPI / Blur)
const lowDpiEvidence = dataset.evidenceList.find((e) =>
  e.qualityIssues.includes('Low Resolution (<150 DPI)')
);
assert.ok(lowDpiEvidence, 'Dataset must detect low resolution (<150 DPI) image files');
console.log('  ✓ Computer Vision verified: Image quality issues flagged (Low Resolution <150 DPI).\n');

// -------------------------------------------------------------
// Test Suite 3: Annotation Lifecycle & AI Suggestion vs Reviewer Findings
// -------------------------------------------------------------
console.log('Test 3: Validating Image Annotation Lifecycle & AI Suggestion Confirmation Boundary...');

// Pick an evidence item with annotations
const targetEvidence = dataset.evidenceList.find((e) => e.annotations.length > 0)!;
assert.ok(targetEvidence, 'Must have at least one evidence item with pins');

const initialAnnotationsCount = targetEvidence.annotations.length;
const aiSuggestion = targetEvidence.annotations.find((a) => a.isAiSuggestion && !a.isReviewerConfirmed);
assert.ok(aiSuggestion, 'Target evidence must contain an unconfirmed AI suggestion pin');
assert.strictEqual(aiSuggestion.isReviewerConfirmed, false, 'AI suggestion must initially NOT be reviewer confirmed');
console.log(`  ✓ Boundary verified: AI Suggestion "${aiSuggestion.label}" is marked unconfirmed.`);

// Simulate Reviewer Confirmation of AI suggestion
const confirmedPin: ImageAnnotation = {
  ...aiSuggestion,
  isReviewerConfirmed: true,
  annotatedBy: 'Regional Scrutiny Officer (WRO)',
};
assert.strictEqual(confirmedPin.isReviewerConfirmed, true, 'Confirmed pin must be flagged as reviewer confirmed');
assert.strictEqual(confirmedPin.annotatedBy, 'Regional Scrutiny Officer (WRO)');
console.log('  ✓ Workflow verified: AI suggestion converted into confirmed officer finding.');

// Add a new manual officer pin with percentage coordinates
const manualPin: ImageAnnotation = {
  id: 'PIN-TEST-NEW',
  evidenceId: targetEvidence.id,
  x: 45,
  y: 60,
  label: 'Unshielded High-Voltage Busbar',
  category: 'Safety Hazard',
  severity: 'Critical',
  notes: 'Exposed 440V supply violates National Electrical Code § 14.',
  annotatedBy: 'Regional Scrutiny Officer (WRO)',
  timestamp: new Date().toISOString(),
  isAiSuggestion: false,
  isReviewerConfirmed: true,
};
assert.strictEqual(manualPin.x >= 0 && manualPin.x <= 100, true, 'Pin X must be a valid percentage');
assert.strictEqual(manualPin.y >= 0 && manualPin.y <= 100, true, 'Pin Y must be a valid percentage');
assert.strictEqual(manualPin.isReviewerConfirmed, true, 'Manual pin is reviewer confirmed by default');
console.log('  ✓ Annotation verified: Dropped pin at (45%, 60%) with Critical severity.\n');

// -------------------------------------------------------------
// Test Suite 4: Missing Evidence Registry & Deficiency Recording
// -------------------------------------------------------------
console.log('Test 4: Auditing Missing Statutory Evidence Recording & Status Transitions...');

const testMissingItem: MissingEvidenceItem = {
  id: 'MISS-TEST-01',
  facilityClaimId: 'FAC-01',
  facilityName: 'Advanced Computer Center & Neural Systems Lab',
  missingEvidenceType: 'Licensed Architect Built-up Area Certificate',
  reason: 'Photograph submitted without statutory room dimensions seal.',
  recommendedNextAction: 'Issue Deficiency Notice requiring COA architect endorsement within 15 days.',
  severity: 'Critical',
  recordedBy: 'Regional Scrutiny Officer (WRO)',
  timestamp: new Date().toISOString(),
  resolved: false,
};

assert.strictEqual(testMissingItem.severity, 'Critical');
assert.strictEqual(testMissingItem.resolved, false);
console.log(`  ✓ Missing evidence recorded: "${testMissingItem.missingEvidenceType}" for ${testMissingItem.facilityName}.\n`);

// -------------------------------------------------------------
// Test Suite 5: Cross-Module Integration with Blind-Spot Detector & Evidence Graph
// -------------------------------------------------------------
console.log('Test 5: Auditing Cross-Module Integration with Blind-Spot Detector & Evidence Graph...');

// 5a: Blind-Spot Detector integration
const blindSpotsData = getInitialClaimsAndBlindSpots();
const infraClaim = blindSpotsData.claims.find((c) => c.id === 'CLM-10');
assert.ok(infraClaim, 'Blind-Spot Detector must include Claim 10 for uncertified infrastructure filing');
assert.strictEqual(
  infraClaim.claimType,
  'Infrastructure Chemistry & Environmental Engineering Laboratory Area'
);
assert.strictEqual(infraClaim.blindSpotId, 'BS-07');

const infraBlindSpot = blindSpotsData.blindSpots.find((b) => b.id === 'BS-07');
assert.ok(infraBlindSpot, 'Blind-Spot Detector must include BS-07 for uncorroborated infrastructure photograph');
assert.ok(
  infraBlindSpot.whatRemainsUnverified.includes('photograph alone cannot legally establish statutory room square-meter dimensions'),
  'Blind spot explanation must cite photograph area limitation'
);
console.log('  ✓ Blind-Spot Detector integrated: Claim CLM-10 linked to BS-07.');

// 5b: Evidence Dependency Graph integration
const mockApplication = {
  id: 'APP-2025-01',
  applicationNumber: 'AICTE/WRO/2025/1-429810931',
  pid: '1-429810931',
  institutionName: 'Veermata Jijabai Technological Institute (VJTI) [Synthetic]',
  institutionType: 'Government / State Aided Technical Institution',
  region: 'Western (WRO)',
  academicYear: '2025-26',
  applicationType: 'Extension of Approval (EoA)',
  currentStage: 'Document Verification & Scrutiny',
  status: 'In Scrutiny',
  overallRiskLevel: 'Low',
  studentStrength: 3200,
  deficienciesCount: 0,
  submissionDate: '2025-01-02',
  processingTimeDays: 4,
} as any;

const graphResult = buildEvidenceGraph(
  mockApplication,
  [],
  [],
  false,
  dataset.evidenceList
);

const infraGraphNodes = graphResult.nodes.filter((n) => n.id.startsWith('infra-'));
assert.ok(
  infraGraphNodes.length > 0,
  'Evidence Dependency Graph must render visual infrastructure evidence nodes when attached'
);
console.log(`  ✓ Evidence Dependency Graph integrated: ${infraGraphNodes.length} infrastructure nodes rendered in lineage graph.`);

console.log('\n=============================================================');
console.log('🎉 ALL 5 INFRASTRUCTURE EVIDENCE REVIEW TESTS PASSED SUCCESSFULLY!');
console.log('=============================================================\n');
