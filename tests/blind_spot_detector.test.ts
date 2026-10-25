import assert from 'node:assert';
import {
  ClaimVerificationStatus,
  DocumentClaim,
  AuthorizedVerificationEvidence,
  ManualReviewInput,
  validateSourceVerificationIntegrity,
  transitionClaimStatus,
  executeManualClaimVerification,
  calculateVerificationCoverage,
  getInitialClaimsAndBlindSpots,
} from '../src/components/blindspot/blindSpotModel';

console.log('🧪 Starting Verification Blind-Spot Detector & Source Barrier Test Suite...\n');

// Mock Base Claim
const baseClaim: DocumentClaim = {
  id: 'TEST-CLM-01',
  documentId: 'TEST-DOC-01',
  applicationId: 'APP-TEST-01',
  institutionName: 'Apex Horizon Institute of Technology',
  pid: '1-339102948',
  claimType: 'Fire & Life Safety Form B NOC',
  claimedValue: 'Validity claimed through 30-Nov-2025',
  sourceDocumentName: 'NOC_FireSafety_2025.pdf',
  pageNumber: 1,
  status: 'Not checked',
  statusReason: 'Initial filing state',
  lastUpdated: new Date().toISOString(),
};

// -------------------------------------------------------------
// Test Suite 1: Source Verification Integrity Barrier Guards
// -------------------------------------------------------------
console.log('Test 1: Enforcing Source Verification Barrier against Non-Authoritative Sources...');

// 1a: Local OCR Match must NEVER count as independent issuer verification
const localOcrAttempt = transitionClaimStatus(
  baseClaim,
  'Verified through authorized source',
  undefined,
  { isLocalOcrOnly: true }
);
assert.strictEqual(localOcrAttempt.success, false, 'Local OCR match must be rejected from source-verified status');
assert.ok(localOcrAttempt.error?.includes('local OCR match cannot count'), 'Error must explicitly state local OCR limitation');
console.log('  ✓ Rejection verified: Local OCR match cannot claim independent source verification.');

// 1b: AI Model Response must NEVER count as independent issuer verification
const aiResponseAttempt = transitionClaimStatus(
  baseClaim,
  'Verified through authorized source',
  undefined,
  { isAiModelResponseOnly: true }
);
assert.strictEqual(aiResponseAttempt.success, false, 'AI model response must be rejected from source-verified status');
assert.ok(aiResponseAttempt.error?.includes('AI model interpretation'), 'Error must explicitly state AI limitation');
console.log('  ✓ Rejection verified: AI model interpretation cannot claim authorized source verification.');

// 1c: Internal applicant database field match must NEVER count as independent issuer verification
const dbMatchAttempt = transitionClaimStatus(
  baseClaim,
  'Verified through authorized source',
  undefined,
  { isDatabaseMatchOnly: true }
);
assert.strictEqual(dbMatchAttempt.success, false, 'Database field match must be rejected from source-verified status');
assert.ok(dbMatchAttempt.error?.includes('applicant-supplied records'), 'Error must cite non-authoritative applicant records');
console.log('  ✓ Rejection verified: Internal applicant-supplied database matches are non-authoritative.');

// 1d: Missing evidence object or missing fields
const emptyEvidenceAttempt = transitionClaimStatus(
  baseClaim,
  'Verified through authorized source',
  undefined
);
assert.strictEqual(emptyEvidenceAttempt.success, false, 'Missing evidence record must be rejected');

const missingSourceAttempt = transitionClaimStatus(
  baseClaim,
  'Verified through authorized source',
  {
    sourceIdentity: '',
    verificationTime: new Date().toISOString(),
    evidenceReference: 'REF-12345',
  }
);
assert.strictEqual(missingSourceAttempt.success, false, 'Missing source identity must be rejected');

const missingRefAttempt = transitionClaimStatus(
  baseClaim,
  'Verified through authorized source',
  {
    sourceIdentity: 'Chief Fire Officer Gateway',
    verificationTime: new Date().toISOString(),
    evidenceReference: '',
  }
);
assert.strictEqual(missingRefAttempt.success, false, 'Missing evidence reference citation must be rejected');
console.log('  ✓ Rejection verified: Incomplete evidence (empty source or reference) is strictly blocked.');

// -------------------------------------------------------------
// Test Suite 2: Valid Authorized Verification Transitions
// -------------------------------------------------------------
console.log('\nTest 2: Authorizing Genuine External Verification Records...');

const validEvidence: AuthorizedVerificationEvidence = {
  sourceIdentity: 'Maharashtra e-Mahabhumi Land Records Directorate',
  verificationTime: '2025-01-18T16:40:00Z',
  evidenceReference: 'MAHA-MUT-2024-99812-CS421A',
  isSyntheticDemo: false,
};

const validTransition = transitionClaimStatus(
  baseClaim,
  'Verified through authorized source',
  validEvidence,
  { statusReason: 'Digital mutation handshake confirmed valid unencumbered title.' }
);

assert.strictEqual(validTransition.success, true, 'Valid authorized evidence must succeed');
assert.strictEqual(validTransition.claim.status, 'Verified through authorized source');
assert.strictEqual(validTransition.claim.authorizedEvidence?.evidenceReference, 'MAHA-MUT-2024-99812-CS421A');
console.log('  ✓ Genuine external verification accepted with immutable evidence reference and timestamp.');

// Non-verified statuses transition smoothly
const partialOcrTransition = transitionClaimStatus(
  baseClaim,
  'Extracted locally',
  undefined,
  { statusReason: 'PyMuPDF extracted raw bounding box text.' }
);
assert.strictEqual(partialOcrTransition.success, true);
assert.strictEqual(partialOcrTransition.claim.status, 'Extracted locally');

const unavailableTransition = transitionClaimStatus(
  baseClaim,
  'Source unavailable',
  undefined,
  { statusReason: 'State fire server gateway returned HTTP 503.' }
);
assert.strictEqual(unavailableTransition.success, true);
assert.strictEqual(unavailableTransition.claim.status, 'Source unavailable');
console.log('  ✓ Granular intermediate statuses (Extracted locally, Source unavailable) transition correctly.');

// -------------------------------------------------------------
// Test Suite 3: Manual Verification Workflow
// -------------------------------------------------------------
console.log('\nTest 3: Validating Manual Scrutiny Officer Verification Workflow...');

const invalidManualInputs: ManualReviewInput[] = [
  {
    reviewerName: '',
    reviewerRole: 'Regional Scrutiny Officer',
    notes: 'Telephonic confirmation with registrar.',
    evidenceReference: 'FILE-9921',
    outcomeStatus: 'Verified through authorized source',
  },
  {
    reviewerName: 'Dr. Vivek Swarup',
    reviewerRole: '',
    notes: 'Telephonic confirmation with registrar.',
    evidenceReference: 'FILE-9921',
    outcomeStatus: 'Verified through authorized source',
  },
  {
    reviewerName: 'Dr. Vivek Swarup',
    reviewerRole: 'Regional Scrutiny Officer',
    notes: 'Short', // Less than 8 characters!
    evidenceReference: 'FILE-9921',
    outcomeStatus: 'Verified through authorized source',
  },
  {
    reviewerName: 'Dr. Vivek Swarup',
    reviewerRole: 'Regional Scrutiny Officer',
    notes: 'Valid detailed audit notes explaining the inspection procedure.',
    evidenceReference: '',
    outcomeStatus: 'Verified through authorized source',
  },
];

for (const badInput of invalidManualInputs) {
  const result = executeManualClaimVerification(baseClaim, badInput);
  assert.strictEqual(result.success, false, 'Incomplete manual input must be rejected');
}
console.log('  ✓ Mandatory manual fields enforced: Reviewer Name, Role, Notes (min 8 chars), and Evidence Reference.');

const validManualInput: ManualReviewInput = {
  reviewerName: 'Dr. Vivek Swarup',
  reviewerRole: 'Senior Appellate Bureau Director',
  notes: 'Conducted direct telephonic liaison with Sub-Registrar Old Custom House; verified Dispatch Serial #421/A matches physical stamp volume.',
  evidenceReference: 'CFO/LIAISON/2025/DISPATCH-491',
  evidenceAttachmentName: 'Attested_SubRegistrar_Memo_Signed.pdf',
  outcomeStatus: 'Verified through authorized source',
};

const manualResult = executeManualClaimVerification(baseClaim, validManualInput);
assert.strictEqual(manualResult.success, true, 'Valid manual review must succeed');
assert.strictEqual(manualResult.claim.status, 'Verified through authorized source');
assert.strictEqual(manualResult.claim.authorizedEvidence?.isManualReview, true);
assert.strictEqual(manualResult.claim.authorizedEvidence?.reviewerIdentity, 'Dr. Vivek Swarup');
assert.strictEqual(manualResult.claim.authorizedEvidence?.evidenceReference, 'CFO/LIAISON/2025/DISPATCH-491');
console.log('  ✓ Manual verification recorded with full audit trail, officer credentials, and dispatch citation.');

// -------------------------------------------------------------
// Test Suite 4: Verification Coverage Calculations
// -------------------------------------------------------------
console.log('\nTest 4: Verifying Coverage Breakdown Calculations across the 5 Required Buckets...');

const { claims: seedClaims, blindSpots: seedBlindSpots } = getInitialClaimsAndBlindSpots();
const coverage = calculateVerificationCoverage(seedClaims, seedBlindSpots);

assert.strictEqual(coverage.totalClaims, seedClaims.length, 'Total claims must match seed array length');
assert.ok(coverage.verifiedCount >= 1, 'Must have verified claims');
assert.ok(coverage.partiallyCheckedCount >= 2, 'Must have partially checked claims');
assert.ok(coverage.pendingCount >= 1, 'Must have pending claims');
assert.ok(coverage.unavailableCount >= 1, 'Must have unavailable source claims');
assert.ok(coverage.inconclusiveCount >= 2, 'Must have inconclusive / manual review required claims');

const sumOfBuckets =
  coverage.verifiedCount +
  coverage.partiallyCheckedCount +
  coverage.pendingCount +
  coverage.unavailableCount +
  coverage.inconclusiveCount;

assert.strictEqual(sumOfBuckets, coverage.totalClaims, 'Sum of all 5 buckets must exactly equal total claims');
console.log(`  ✓ Exact bucket count validated: Total ${coverage.totalClaims} = Verified (${coverage.verifiedCount}) + Partial (${coverage.partiallyCheckedCount}) + Pending (${coverage.pendingCount}) + Unavailable (${coverage.unavailableCount}) + Inconclusive (${coverage.inconclusiveCount})`);
console.log(`  ✓ Authorized source coverage: ${coverage.authorizedSourceCoveragePercent}% | Blind-spot gap rate: ${coverage.unverifiedBlindSpotPercent}%`);

// -------------------------------------------------------------
// Test Suite 5: Regulatory Blind Spot Categorization
// -------------------------------------------------------------
console.log('\nTest 5: Validating the 5 Core Regulatory Blind Spot Types...');

const expectedTypes = new Set([
  'MISSING_SOURCE_CREDENTIALS',
  'UNAVAILABLE_ISSUER_PORTAL',
  'MISSING_HISTORICAL_RECORDS',
  'UNREADABLE_DOCUMENT',
  'UNSUPPORTED_DOCUMENT_TYPE',
]);

const observedTypes = new Set(seedBlindSpots.map((b) => b.type));

for (const t of expectedTypes) {
  assert.ok(observedTypes.has(t as any), `Seed blind spots must contain type: ${t}`);
}

for (const spot of seedBlindSpots) {
  assert.ok(spot.whatRemainsUnverified.length >= 20, `Blind spot ${spot.id} missing clear explanation`);
  assert.ok(spot.nextRecommendedAction.length >= 20, `Blind spot ${spot.id} missing actionable recommendation`);
  assert.ok(spot.missingSourceOrPortal.length >= 3, `Blind spot ${spot.id} missing target authority`);
}
console.log('  ✓ All 5 regulatory blind-spot types verified with detailed explanations and next recommended actions.');

console.log('\n🎉 ALL 5 VERIFICATION BLIND-SPOT DETECTOR TEST SUITES PASSED WITH 100% SUCCESS!\n');
