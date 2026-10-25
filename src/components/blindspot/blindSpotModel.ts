/**
 * Verification Blind-Spot Detector Model & Integrity Guards
 * 
 * STRICT REGULATORY INTEGRITY RULE:
 * A claim or document can ONLY be marked "Verified through authorized source"
 * if a genuine, successful, authorized verification result has been recorded
 * with source identity, verification time, and an evidence/reference citation.
 * 
 * A local OCR match, a valid-looking PDF, an AI model response,
 * or a matching database field MUST NEVER count as independent issuer verification.
 */

export type ClaimVerificationStatus =
  | 'Not checked'
  | 'Processing failed'
  | 'Extracted locally'
  | 'Matched against supplied records'
  | 'Verified through authorized source'
  | 'Source unavailable'
  | 'Manual verification required'
  | 'Inconclusive';

export interface AuthorizedVerificationEvidence {
  sourceIdentity: string; // e.g. "DigiLocker / NAD", "Chief Fire Officer (GBN e-Fire Portal)", "EPFO Unified Portal"
  verificationTime: string; // ISO 8601 timestamp
  evidenceReference: string; // Transaction ID, API hash, digital certificate serial, official receipt
  isManualReview?: boolean;
  reviewerIdentity?: string; // Officer Name & Designation
  reviewerRole?: string;
  reviewerNotes?: string;
  evidenceAttachmentName?: string;
  isSyntheticDemo?: boolean; // Explicitly labeled when simulated
}

export interface DocumentClaim {
  id: string;
  documentId: string;
  applicationId: string;
  institutionName: string;
  pid: string;
  claimType: string; // e.g. "Land Mutation Record", "Fire Safety NOC Validity", "Faculty Cadre & EPFO"
  claimedValue: string; // e.g. "16.5 Acres CS 421/A", "Valid till 30-Nov-2024", "Dr. Rajesh Kumar Sharma"
  sourceDocumentName: string;
  pageNumber?: number;
  status: ClaimVerificationStatus;
  statusReason: string;
  authorizedEvidence?: AuthorizedVerificationEvidence;
  blindSpotId?: string;
  lastUpdated: string;
}

export type BlindSpotType =
  | 'MISSING_SOURCE_CREDENTIALS'
  | 'UNAVAILABLE_ISSUER_PORTAL'
  | 'MISSING_HISTORICAL_RECORDS'
  | 'UNREADABLE_DOCUMENT'
  | 'UNSUPPORTED_DOCUMENT_TYPE';

export interface BlindSpotRecord {
  id: string;
  type: BlindSpotType;
  title: string;
  severity: 'Critical' | 'High' | 'Medium';
  documentId?: string;
  claimId?: string;
  applicationId: string;
  institutionName: string;
  pid: string;
  affectedClaim: string;
  whatRemainsUnverified: string; // Explanation of what cannot be authoritatively checked
  nextRecommendedAction: string; // Clear, actionable procedure
  missingSourceOrPortal: string; // Authority / portal identity
  detectedAt: string;
  isDemoMode?: boolean;
  resolved?: boolean;
  resolutionRecord?: {
    resolvedBy: string;
    resolvedAt: string;
    resolutionNotes: string;
    resultingStatus: ClaimVerificationStatus;
  };
}

export interface VerificationCoverageSummary {
  totalClaims: number;
  verifiedCount: number; // "Verified through authorized source"
  partiallyCheckedCount: number; // "Extracted locally" + "Matched against supplied records"
  pendingCount: number; // "Not checked"
  unavailableCount: number; // "Source unavailable"
  inconclusiveCount: number; // "Inconclusive" + "Processing failed" + "Manual verification required"
  
  // Percentages (0 to 100)
  authorizedSourceCoveragePercent: number; // (verifiedCount / totalClaims) * 100
  localOrPartialCoveragePercent: number; // ((verifiedCount + partiallyCheckedCount) / totalClaims) * 100
  unverifiedBlindSpotPercent: number; // ((pendingCount + unavailableCount + inconclusiveCount) / totalClaims) * 100
  
  criticalBlindSpotsCount: number;
  openBlindSpotsCount: number;
}

export interface ManualReviewInput {
  reviewerName: string;
  reviewerRole: string;
  notes: string;
  evidenceReference: string;
  evidenceAttachmentName?: string;
  outcomeStatus: 'Verified through authorized source' | 'Inconclusive' | 'Manual verification required';
}

/**
 * SOURCE VERIFICATION INTEGRITY BARRIER
 * 
 * Validates that an item can ONLY be set to 'Verified through authorized source'
 * if genuine, authorized external verification evidence is present.
 * 
 * Rejects local OCR matches, valid-looking PDFs, AI model responses,
 * and internal database matches from claiming authorized status.
 */
export function validateSourceVerificationIntegrity(
  attemptedStatus: ClaimVerificationStatus,
  evidence?: AuthorizedVerificationEvidence,
  options?: {
    isLocalOcrOnly?: boolean;
    isAiModelResponseOnly?: boolean;
    isDatabaseMatchOnly?: boolean;
  }
): { valid: boolean; error?: string } {
  if (attemptedStatus === 'Verified through authorized source') {
    // 1. Must not be derived purely from local OCR
    if (options?.isLocalOcrOnly) {
      return {
        valid: false,
        error: 'Integrity Violation: A local OCR match cannot count as independent issuer verification.',
      };
    }

    // 2. Must not be derived purely from AI model interpretation
    if (options?.isAiModelResponseOnly) {
      return {
        valid: false,
        error: 'Integrity Violation: An AI model interpretation or text response cannot count as authorized source verification.',
      };
    }

    // 3. Must not be derived purely from internal database field matching
    if (options?.isDatabaseMatchOnly) {
      return {
        valid: false,
        error: 'Integrity Violation: Matching against internal applicant-supplied records is non-authoritative and cannot establish source verification.',
      };
    }

    // 4. Must possess genuine authorized evidence fields
    if (!evidence) {
      return {
        valid: false,
        error: 'Integrity Violation: Missing authorized verification evidence record.',
      };
    }

    if (!evidence.sourceIdentity || evidence.sourceIdentity.trim() === '') {
      return {
        valid: false,
        error: 'Integrity Violation: Authorized source identity (issuing authority or registrar) is mandatory.',
      };
    }

    if (!evidence.verificationTime || evidence.verificationTime.trim() === '') {
      return {
        valid: false,
        error: 'Integrity Violation: Verification timestamp is mandatory.',
      };
    }

    if (!evidence.evidenceReference || evidence.evidenceReference.trim() === '') {
      return {
        valid: false,
        error: 'Integrity Violation: Independent evidence reference, certificate digest, or receipt transaction ID is mandatory.',
      };
    }
  }

  return { valid: true };
}

/**
 * Transitions a claim status strictly adhering to regulatory guards.
 */
export function transitionClaimStatus(
  claim: DocumentClaim,
  newStatus: ClaimVerificationStatus,
  evidence?: AuthorizedVerificationEvidence,
  options?: {
    isLocalOcrOnly?: boolean;
    isAiModelResponseOnly?: boolean;
    isDatabaseMatchOnly?: boolean;
    statusReason?: string;
  }
): { success: boolean; claim: DocumentClaim; error?: string } {
  const check = validateSourceVerificationIntegrity(newStatus, evidence, options);
  if (!check.valid) {
    return {
      success: false,
      claim,
      error: check.error,
    };
  }

  const updatedClaim: DocumentClaim = {
    ...claim,
    status: newStatus,
    statusReason: options?.statusReason || claim.statusReason,
    authorizedEvidence: newStatus === 'Verified through authorized source' ? evidence : claim.authorizedEvidence,
    lastUpdated: new Date().toISOString(),
  };

  return {
    success: true,
    claim: updatedClaim,
  };
}

/**
 * Executes a manual verification workflow by an authorized scrutiny officer.
 * Records reviewer identity, notes, evidence attachment/reference, and timestamp.
 */
export function executeManualClaimVerification(
  claim: DocumentClaim,
  input: ManualReviewInput
): { success: boolean; claim: DocumentClaim; error?: string } {
  if (!input.reviewerName || input.reviewerName.trim() === '') {
    return { success: false, claim, error: 'Reviewer name/identity is required.' };
  }
  if (!input.reviewerRole || input.reviewerRole.trim() === '') {
    return { success: false, claim, error: 'Reviewer official designation/role is required.' };
  }
  if (!input.notes || input.notes.trim().length < 8) {
    return { success: false, claim, error: 'Detailed audit notes explaining the verification procedure are required (minimum 8 characters).' };
  }
  if (!input.evidenceReference || input.evidenceReference.trim() === '') {
    return { success: false, claim, error: 'Evidence reference citation (e.g. Physical file no., certified dispatch reference) is required.' };
  }

  const timestamp = new Date().toISOString();

  const evidence: AuthorizedVerificationEvidence = {
    sourceIdentity: `Manual Scrutiny Officer Verification (${input.reviewerRole})`,
    verificationTime: timestamp,
    evidenceReference: input.evidenceReference,
    isManualReview: true,
    reviewerIdentity: input.reviewerName,
    reviewerRole: input.reviewerRole,
    reviewerNotes: input.notes,
    evidenceAttachmentName: input.evidenceAttachmentName,
    isSyntheticDemo: false,
  };

  return transitionClaimStatus(claim, input.outcomeStatus, evidence, {
    statusReason: `Officer Manual Scrutiny: ${input.notes}`,
  });
}

/**
 * Computes coverage statistics across tracked claims and blind spots.
 */
export function calculateVerificationCoverage(
  claims: DocumentClaim[],
  blindSpots: BlindSpotRecord[]
): VerificationCoverageSummary {
  const total = claims.length;

  let verifiedCount = 0;
  let partiallyCheckedCount = 0;
  let pendingCount = 0;
  let unavailableCount = 0;
  let inconclusiveCount = 0;

  for (const c of claims) {
    switch (c.status) {
      case 'Verified through authorized source':
        verifiedCount++;
        break;
      case 'Extracted locally':
      case 'Matched against supplied records':
        partiallyCheckedCount++;
        break;
      case 'Not checked':
        pendingCount++;
        break;
      case 'Source unavailable':
        unavailableCount++;
        break;
      case 'Inconclusive':
      case 'Processing failed':
      case 'Manual verification required':
        inconclusiveCount++;
        break;
    }
  }

  const authorizedSourceCoveragePercent = total > 0 ? Number(((verifiedCount / total) * 100).toFixed(1)) : 0;
  const localOrPartialCoveragePercent = total > 0 ? Number((((verifiedCount + partiallyCheckedCount) / total) * 100).toFixed(1)) : 0;
  const unverifiedBlindSpotPercent = total > 0 ? Number((((pendingCount + unavailableCount + inconclusiveCount) / total) * 100).toFixed(1)) : 0;

  const criticalBlindSpotsCount = blindSpots.filter((b) => b.severity === 'Critical' && !b.resolved).length;
  const openBlindSpotsCount = blindSpots.filter((b) => !b.resolved).length;

  return {
    totalClaims: total,
    verifiedCount,
    partiallyCheckedCount,
    pendingCount,
    unavailableCount,
    inconclusiveCount,
    authorizedSourceCoveragePercent,
    localOrPartialCoveragePercent,
    unverifiedBlindSpotPercent,
    criticalBlindSpotsCount,
    openBlindSpotsCount,
  };
}

/**
 * Helper to build initial seed claims and blind spots for persisted applications and documents.
 */
export function getInitialClaimsAndBlindSpots(): {
  claims: DocumentClaim[];
  blindSpots: BlindSpotRecord[];
} {
  const claims: DocumentClaim[] = [
    // Claim 1: VJTI Land Title (Compliant & Source Verified through e-Mahabhumi)
    {
      id: 'CLM-01',
      documentId: 'DOC-02',
      applicationId: 'APP-2025-01',
      institutionName: 'Veermata Jijabai Technological Institute (VJTI) [Synthetic]',
      pid: '1-429810931',
      claimType: 'Government Land Mutation & Area Tenure',
      claimedValue: '16.50 Acres • CS No. 421/A Matunga',
      sourceDocumentName: 'Land_Title_Deed_VJTI_Matunga_GovtDeed.pdf',
      pageNumber: 1,
      status: 'Verified through authorized source',
      statusReason: 'Cryptographic handshake with State e-Mahabhumi land mutation ledger confirmed zero encumbrance.',
      authorizedEvidence: {
        sourceIdentity: 'Maharashtra e-Mahabhumi Land Records Directorate',
        verificationTime: '2025-01-18T16:40:00Z',
        evidenceReference: 'MAHA-MUT-2024-99812-CS421A',
        isSyntheticDemo: true,
      },
      lastUpdated: '2025-01-18 16:40:00',
    },

    // Claim 2: Apex Horizon Fire NOC (Expired + Tampered -> Source Unavailable / Manual verification required)
    {
      id: 'CLM-02',
      documentId: 'DOC-01',
      applicationId: 'APP-2025-03',
      institutionName: 'Apex Horizon Institute of Technology & Management [Synthetic]',
      pid: '1-339102948',
      claimType: 'Fire & Life Safety Form B NOC',
      claimedValue: 'Validity claimed through 2025 (Modified)',
      sourceDocumentName: 'NOC_FireSafety_GreaterNoida_2024_Signed.pdf',
      pageNumber: 1,
      status: 'Source unavailable',
      statusReason: 'State Fire Service public verification gateway returned 503 Service Unavailable. Certificate exhibits font alteration.',
      blindSpotId: 'BS-01',
      lastUpdated: '2025-01-05 14:22:10',
    },

    // Claim 3: Apex Horizon Faculty Cadre (Ghost faculty overlap -> Manual verification required)
    {
      id: 'CLM-03',
      documentId: 'DOC-03',
      applicationId: 'APP-2025-03',
      institutionName: 'Apex Horizon Institute of Technology & Management [Synthetic]',
      pid: '1-339102948',
      claimType: 'Faculty Resident Professor Employment',
      claimedValue: 'Prof. Dr. Ramesh Chandra (Full-Time)',
      sourceDocumentName: 'Form16_Faculty_List_AY2024_25.pdf',
      pageNumber: 2,
      status: 'Manual verification required',
      statusReason: 'EPFO UAN database indicates concurrent active salary deductions at another engineering college in Lucknow (480 km away).',
      blindSpotId: 'BS-02',
      lastUpdated: '2025-01-05 16:15:20',
    },

    // Claim 4: Vanguard Architecture Survey Boundary (Missing cadastral credentials -> Inconclusive)
    {
      id: 'CLM-04',
      documentId: 'DOC-05',
      applicationId: 'APP-2025-05',
      institutionName: 'Vanguard College of Architecture & Planning [Synthetic]',
      pid: '1-840192834',
      claimType: 'Contiguous Survey Khesra Boundary',
      claimedValue: '1.80 Acres under Survey Khesra 89/2A and 89/2B',
      sourceDocumentName: 'Architect_Certificate_BuiltUp_Area.pdf',
      pageNumber: 1,
      status: 'Inconclusive',
      statusReason: 'Regional municipality GIS credentials not configured in regulatory console; unable to verify land tenure overlay.',
      blindSpotId: 'BS-03',
      lastUpdated: '2025-01-08 12:10:00',
    },

    // Claim 5: Swaminarayan Polytechnic Historical Affiliation (Pre-2015 approval archive missing)
    {
      id: 'CLM-05',
      documentId: 'DOC-06',
      applicationId: 'APP-2025-06',
      institutionName: 'Shree Swaminarayan Gurukul Polytechnic [Synthetic]',
      pid: '1-710293845',
      claimType: 'Sanctioned Intake Year 2008 Establishment',
      claimedValue: 'Permanent establishment sanctioned in AY 2008-09',
      sourceDocumentName: 'State_Affiliation_Undertaking_2024.pdf',
      pageNumber: 3,
      status: 'Not checked',
      statusReason: 'Pre-2015 regional approval records absent from digitized national repository.',
      blindSpotId: 'BS-04',
      lastUpdated: '2025-01-07 10:00:00',
    },

    // Claim 6: Low DPI Degraded Structural Stability Scan (Unreadable Document)
    {
      id: 'CLM-06',
      documentId: 'DOC-07',
      applicationId: 'APP-2025-04',
      institutionName: 'BMS College of Engineering [Synthetic]',
      pid: '1-449102833',
      claimType: 'Seismic Structural Safety Certificate',
      claimedValue: 'Zone III Structural Clearance',
      sourceDocumentName: 'Structural_Stability_BMS_OldBlock.pdf',
      pageNumber: 1,
      status: 'Processing failed',
      statusReason: 'Resolution below 120 DPI with corrupted glyph tables; optical character extraction failed.',
      blindSpotId: 'BS-05',
      lastUpdated: '2025-01-11 15:30:00',
    },

    // Claim 7: Vernacular Handwritten Revenue Affidavit (Unsupported Document Type)
    {
      id: 'CLM-07',
      documentId: 'DOC-08',
      applicationId: 'APP-2025-08',
      institutionName: 'Heritage Institute of Technology [Synthetic]',
      pid: '1-229104859',
      claimType: 'Gram Panchayat Access Road Undertaking',
      claimedValue: '12-Meter Approach Road Right of Way',
      sourceDocumentName: 'GramPanchayat_Vernacular_Affidavit.pdf',
      pageNumber: 1,
      status: 'Manual verification required',
      statusReason: 'Handwritten script in regional Marathi format lacks machine-readable digital layout.',
      blindSpotId: 'BS-06',
      lastUpdated: '2025-01-14 09:45:00',
    },

    // Claim 8: COEP Computer Engineering Intake (Matched against supplied records)
    {
      id: 'CLM-08',
      documentId: 'DOC-04',
      applicationId: 'APP-2025-02',
      institutionName: 'College of Engineering Pune (COEP Tech Univ) [Synthetic]',
      pid: '1-893012741',
      claimType: 'UG Computer Engineering Sanctioned Intake',
      claimedValue: '180 Approved Seats',
      sourceDocumentName: 'COEP_EoA_PreviousCycle_Approval.pdf',
      pageNumber: 2,
      status: 'Matched against supplied records',
      statusReason: 'Consistent with applicant-supplied previous year EoA filing. Independent registrar handshake pending.',
      lastUpdated: '2025-01-19 14:00:00',
    },

    // Claim 9: Somaiya Institute AICTE Corpus FD (Extracted locally via OCR)
    {
      id: 'CLM-09',
      documentId: 'DOC-09',
      applicationId: 'APP-2025-07',
      institutionName: 'K. J. Somaiya Institute of Management [Synthetic]',
      pid: '1-665182903',
      claimType: 'Corpus Fixed Deposit Bank Guarantee',
      claimedValue: 'INR 1,00,00,000 (State Bank of India)',
      sourceDocumentName: 'Joint_Corpus_Fixed_Deposit_Receipt.pdf',
      pageNumber: 1,
      status: 'Extracted locally',
      statusReason: 'Neural OCR matched bank FDR number and joint holder AICTE text. Core banking API handshake not conducted.',
      lastUpdated: '2025-01-12 11:20:00',
    },

    // Claim 10: Apex Horizon Uncertified Chemistry Lab Photographic Filing (Infrastructure Evidence)
    {
      id: 'CLM-10',
      documentId: 'DOC-INFRA-01',
      applicationId: 'APP-2025-03',
      institutionName: 'Apex Horizon Institute of Technology & Management [Synthetic]',
      pid: '1-339102948',
      claimType: 'Infrastructure Chemistry & Environmental Engineering Laboratory Area',
      claimedValue: '120 sq.m functional laboratory (Photograph only supplied)',
      sourceDocumentName: 'Apex_Chemistry_Lab_Filing_2025.jpg',
      pageNumber: 1,
      status: 'Manual verification required',
      statusReason: 'Photograph submitted without Council of Architecture certified floor dimensions or EVC physical measurement.',
      blindSpotId: 'BS-07',
      lastUpdated: '2025-01-15 11:20:00',
    },
  ];

  const blindSpots: BlindSpotRecord[] = [
    // Blind Spot 1: Unavailable Issuer Portal
    {
      id: 'BS-01',
      type: 'UNAVAILABLE_ISSUER_PORTAL',
      title: 'State Fire Service Public Verification Gateway Downtime',
      severity: 'Critical',
      documentId: 'DOC-01',
      claimId: 'CLM-02',
      applicationId: 'APP-2025-03',
      institutionName: 'Apex Horizon Institute of Technology & Management [Synthetic]',
      pid: '1-339102948',
      affectedClaim: 'Fire & Life Safety Form B Validity (CFO/GBN/2021/8892-REV)',
      whatRemainsUnverified:
        'Official issuance dispatch records and expiry dates cannot be confirmed with the Uttar Pradesh Fire Service Directorate. The provided PDF exhibits font tampering, but dynamic serial check cannot execute.',
      nextRecommendedAction:
        'Convene physical Expert Visit Committee (EVC) fire inspection and issue formal requisition letter to Chief Fire Officer Gautam Buddha Nagar.',
      missingSourceOrPortal: 'Directorate of Fire & Emergency Services Public Gateway (HTTP 503)',
      detectedAt: '2025-01-05 14:22:10',
      isDemoMode: true,
      resolved: false,
    },

    // Blind Spot 2: Missing Source Credentials for Real-Time EPFO Cross-Check
    {
      id: 'BS-02',
      type: 'MISSING_SOURCE_CREDENTIALS',
      title: 'EPFO UAN / TRRN Gateway API Credentials Not Configured',
      severity: 'Critical',
      documentId: 'DOC-03',
      claimId: 'CLM-03',
      applicationId: 'APP-2025-03',
      institutionName: 'Apex Horizon Institute of Technology & Management [Synthetic]',
      pid: '1-339102948',
      affectedClaim: 'Faculty Resident Employment & Full-Time Exclusivity (Dr. Ramesh Chandra)',
      whatRemainsUnverified:
        'Concurrent salary remittances and provident fund deposits at competing institutions across state lines cannot be validated automatically without authenticated EPFO enterprise credentials.',
      nextRecommendedAction:
        'Configure regulatory EPFO e-Pramaan API client credentials in System Settings, or schedule surprise Aadhaar Biometric Attendance (AEBAS) audit.',
      missingSourceOrPortal: 'EPFO Employer Electronic Challan cum Return (ECR) Gateway',
      detectedAt: '2025-01-05 16:15:20',
      isDemoMode: true,
      resolved: false,
    },

    // Blind Spot 3: Missing Source Credentials for Cadastral GIS
    {
      id: 'BS-03',
      type: 'MISSING_SOURCE_CREDENTIALS',
      title: 'Municipal Cadastral GIS Authentication Token Missing',
      severity: 'High',
      documentId: 'DOC-05',
      claimId: 'CLM-04',
      applicationId: 'APP-2025-05',
      institutionName: 'Vanguard College of Architecture & Planning [Synthetic]',
      pid: '1-840192834',
      affectedClaim: 'Survey Khesra 89/2A and 89/2B Contiguity',
      whatRemainsUnverified:
        'Whether Khesra 89/2B is subject to highway expansion buffer or disputed ownership. Local GIS layers cannot be queried without regional revenue token.',
      nextRecommendedAction:
        'Require applicant to furnish digitally signed e-Mahabhumi 7/12 extract with QR code, or inspect revenue survey sheet during physical EVC visit.',
      missingSourceOrPortal: 'State Revenue Digital Cadastre & Bhoomi GIS Token',
      detectedAt: '2025-01-08 12:10:00',
      isDemoMode: true,
      resolved: false,
    },

    // Blind Spot 4: Missing Historical Records
    {
      id: 'BS-04',
      type: 'MISSING_HISTORICAL_RECORDS',
      title: 'Pre-2015 Physical Establishment Approvals Absent from Central Digitized Ledger',
      severity: 'Medium',
      documentId: 'DOC-06',
      claimId: 'CLM-05',
      applicationId: 'APP-2025-06',
      institutionName: 'Shree Swaminarayan Gurukul Polytechnic [Synthetic]',
      pid: '1-710293845',
      affectedClaim: 'Sanctioned Initial Intake (AY 2008-09 Establishment)',
      whatRemainsUnverified:
        'Original physical gazette sanction and AICTE western regional bureau files from 2008 are missing from the digitized national archives repository.',
      nextRecommendedAction:
        'Issue notice to the affiliating state technical education board to furnish attested copy of original 2008 affiliation council resolution.',
      missingSourceOrPortal: 'National Central Archive Pre-2015 Digitized Registry',
      detectedAt: '2025-01-07 10:00:00',
      isDemoMode: true,
      resolved: false,
    },

    // Blind Spot 5: Unreadable Document
    {
      id: 'BS-05',
      type: 'UNREADABLE_DOCUMENT',
      title: 'Degraded Scan Resolution (<120 DPI) with Illegible Structural Stamp',
      severity: 'High',
      documentId: 'DOC-07',
      claimId: 'CLM-06',
      applicationId: 'APP-2025-04',
      institutionName: 'BMS College of Engineering [Synthetic]',
      pid: '1-449102833',
      affectedClaim: 'Seismic Structural Safety & Civil Engineer Registration Seal',
      whatRemainsUnverified:
        'The chartered structural engineer license number and municipal building stability clause cannot be extracted due to pixel blur and scanner noise.',
      nextRecommendedAction:
        'Issue immediate deficiency notice requesting re-upload of 300+ DPI color scan or a digitally signed PDF with cryptographic certificate.',
      missingSourceOrPortal: 'High-Resolution Document Ingestion Pipeline',
      detectedAt: '2025-01-11 15:30:00',
      isDemoMode: true,
      resolved: false,
    },

    // Blind Spot 6: Unsupported Document Type
    {
      id: 'BS-06',
      type: 'UNSUPPORTED_DOCUMENT_TYPE',
      title: 'Handwritten Vernacular Gram Panchayat Affidavit Without Standard Stamp Format',
      severity: 'Medium',
      documentId: 'DOC-08',
      claimId: 'CLM-07',
      applicationId: 'APP-2025-08',
      institutionName: 'Heritage Institute of Technology [Synthetic]',
      pid: '1-229104859',
      affectedClaim: 'Gram Panchayat 12-Meter Approach Road Right of Way',
      whatRemainsUnverified:
        'Handwritten regional Marathi script on non-judicial stamp paper cannot be parsed by automated schemas or validated against digital e-Stamping portals.',
      nextRecommendedAction:
        'Route to Regional Scrutiny Officer for manual reading, or request standard English/Hindi translation affidavit endorsed by an executive magistrate.',
      missingSourceOrPortal: 'Automated Vernacular Handwritten OCR Engine',
      detectedAt: '2025-01-14 09:45:00',
      isDemoMode: true,
      resolved: false,
    },

    // Blind Spot 7: Uncorroborated Photo Evidence for Physical Laboratory
    {
      id: 'BS-07',
      type: 'MISSING_SOURCE_CREDENTIALS',
      title: 'Uncorroborated Infrastructure Photograph Lacking Registered Architect Area Certificate',
      severity: 'Critical',
      documentId: 'DOC-INFRA-01',
      claimId: 'CLM-10',
      applicationId: 'APP-2025-03',
      institutionName: 'Apex Horizon Institute of Technology & Management [Synthetic]',
      pid: '1-339102948',
      affectedClaim: 'Infrastructure Chemistry & Environmental Engineering Laboratory (120 sq.m)',
      whatRemainsUnverified:
        'A submitted photograph alone cannot legally establish statutory room square-meter dimensions or working fume-hood exhaust utilities without a registered COA architect certificate or physical EVC measurement.',
      nextRecommendedAction:
        'Issue Deficiency Notice to upload Council of Architecture Registered Architect Built-up Certificate or schedule on-site physical EVC inspection.',
      missingSourceOrPortal: 'Council of Architecture (COA) / AICTE On-Site EVC Committee',
      detectedAt: '2025-01-15 11:20:00',
      isDemoMode: true,
      resolved: false,
    },
  ];

  return { claims, blindSpots };
}
