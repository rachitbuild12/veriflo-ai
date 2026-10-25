/**
 * Infrastructure Evidence Review Model & Regulatory Safeguards
 * 
 * REGULATORY INTEGRITY MANDATE:
 * 1. A photograph alone does NOT prove that a laboratory is functional,
 *    a room meets regulatory dimensions, or an infrastructure facility
 *    physically exists unless verified by independent supporting evidence
 *    (e.g., registered architect built-up area certificate, municipal OC,
 *    or Expert Visit Committee on-site measurements).
 * 2. Visual differences between two photographs or drawings do NOT independently
 *    establish fraud.
 * 3. AI computer vision suggestions MUST be clearly distinguished from
 *    reviewer-confirmed observations.
 */

export type FacilityType =
  | 'Instructional Area'
  | 'Laboratories & Workshops'
  | 'Computer Centers & Server Rooms'
  | 'Library & Reading Rooms'
  | 'Administrative & Faculty Offices'
  | 'Life Safety & Fire Installations'
  | 'Barrier-Free & Divyangjan Access'
  | 'Campus Grounds & Outdoor Amenities';

export type InfrastructureEvidenceType =
  | 'Photograph'
  | 'Floor Plan / Blueprint'
  | 'Statutory Certificate'
  | 'CAD Drawing';

export type ImageQualityIssue =
  | 'Low Resolution (<150 DPI)'
  | 'Blur / Out of Focus'
  | 'Severe Underexposure'
  | 'Obscured Room Boundary'
  | 'Distorted Lens Perspective';

export type MetadataAnomaly =
  | 'EXIF Timestamp Mismatch'
  | 'Photo Editing Software Trace'
  | 'Missing Mandatory Geo-tag'
  | 'Duplicate Photo Collision';

export interface ImageAnnotation {
  id: string;
  evidenceId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string;
  category: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Observation';
  notes: string;
  annotatedBy: string;
  timestamp: string;
  isAiSuggestion: boolean;
  isReviewerConfirmed: boolean;
}

export interface MissingEvidenceItem {
  id: string;
  facilityClaimId: string;
  facilityName: string;
  missingEvidenceType: string;
  reason: string;
  recommendedNextAction: string;
  severity: 'Critical' | 'Major' | 'Minor';
  recordedBy: string;
  timestamp: string;
  resolved?: boolean;
}

export interface ClaimedFacility {
  id: string;
  facilityName: string;
  facilityType: FacilityType;
  claimedAreaSqM: number;
  claimedCapacity: number;
  roomNumber: string;
  buildingBlock: string;
  status: 'Compliant' | 'Deficit Flagged' | 'Pending Review' | 'Inconclusive';
  complianceClause: string;
  evidenceIds: string[];
  missingEvidenceIds: string[];
  reviewerVerdictNotes?: string;
}

export interface InfrastructureEvidence {
  id: string;
  applicationId: string;
  institutionName: string;
  pid: string;
  title: string;
  evidenceType: InfrastructureEvidenceType;
  facilityType: FacilityType;
  linkedFacilityId: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  uploadedAt: string;
  extractedText: string;
  aiClassification: string;
  aiConfidence: number;
  qualityIssues: ImageQualityIssue[];
  metadataAnomalies: MetadataAnomaly[];
  exifMetadata: {
    cameraMake?: string;
    cameraModel?: string;
    software?: string;
    originalDate?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    hasGeoTag: boolean;
  };
  sha256Hash: string;
  isDuplicate: boolean;
  duplicateOfId?: string;
  annotations: ImageAnnotation[];
  reviewHistory: Array<{
    reviewedBy: string;
    action: string;
    timestamp: string;
    notes: string;
  }>;
  reviewerVerdict:
    | 'Unreviewed'
    | 'Satisfactory Supporting Evidence'
    | 'Deficiency Flagged'
    | 'Inconclusive / Physical EVC Needed';
  reviewerNotes?: string;
}

/**
 * REGULATORY SAFEGUARD ASSERTION:
 * Rejects claiming that a photo alone proves functionality or dimensions
 * without independent supporting documents.
 */
export function validateInfrastructureClaimProof(
  hasPhoto: boolean,
  hasIndependentCertificate: boolean,
  hasPhysicalOrEvcInspection: boolean
): { valid: boolean; reason: string } {
  if (hasPhoto && !hasIndependentCertificate && !hasPhysicalOrEvcInspection) {
    return {
      valid: false,
      reason:
        'Regulatory Guardrail: A photograph alone cannot establish that a room satisfies statutory square meter dimensions, is equipped with operational utilities, or physically exists in the approved building block. Registered Architect Built-up Certificate or EVC physical measurement is mandatory.',
    };
  }
  return {
    valid: true,
    reason: 'Supporting independent documentary or inspection evidence satisfies AICTE APH Chapter VI requirements.',
  };
}

/**
 * Creates initial synthetic infrastructure claims and evidence records
 * demonstrating diverse facility types, floor plans, photo annotations, and metadata checks.
 */
export function getInitialInfrastructureDataset(): {
  facilities: ClaimedFacility[];
  evidenceList: InfrastructureEvidence[];
  missingEvidenceList: MissingEvidenceItem[];
} {
  const facilities: ClaimedFacility[] = [
    {
      id: 'FAC-01',
      facilityName: 'Advanced Computer Center & Neural Systems Lab',
      facilityType: 'Computer Centers & Server Rooms',
      claimedAreaSqM: 165,
      claimedCapacity: 60,
      roomNumber: 'Room 204',
      buildingBlock: 'Block B (Academic Center)',
      status: 'Compliant',
      complianceClause: 'APH 2025-26 Ch.6 - Digital Computing Norms (Min 150 sq.m)',
      evidenceIds: ['INFRA-01', 'INFRA-02'],
      missingEvidenceIds: [],
    },
    {
      id: 'FAC-02',
      facilityName: 'Fluid Mechanics & Strength of Materials Laboratory',
      facilityType: 'Laboratories & Workshops',
      claimedAreaSqM: 120,
      claimedCapacity: 30,
      roomNumber: 'Workshop Block Ground Floor',
      buildingBlock: 'Block C (Engineering Workshops)',
      status: 'Deficit Flagged',
      complianceClause: 'APH 2025-26 Ch.6 - Heavy Engineering Labs (Min 120 sq.m + Safety Perimeter)',
      evidenceIds: ['INFRA-03', 'INFRA-04'],
      missingEvidenceIds: ['MISS-01'],
    },
    {
      id: 'FAC-03',
      facilityName: 'Smart Interactive Lecture Hall (Tiered Seating)',
      facilityType: 'Instructional Area',
      claimedAreaSqM: 88,
      claimedCapacity: 75,
      roomNumber: 'LT-101',
      buildingBlock: 'Block A (Main Administrative)',
      status: 'Compliant',
      complianceClause: 'APH 2025-26 Ch.6 - Smart Classroom Norm (Min 66 sq.m for 60 students)',
      evidenceIds: ['INFRA-05'],
      missingEvidenceIds: [],
    },
    {
      id: 'FAC-04',
      facilityName: 'Universal Barrier-Free Accessible Ramp & Elevator',
      facilityType: 'Barrier-Free & Divyangjan Access',
      claimedAreaSqM: 45,
      claimedCapacity: 20,
      roomNumber: 'Main Entrance & Central Library Core',
      buildingBlock: 'Block A & B Connector',
      status: 'Deficit Flagged',
      complianceClause: 'Harmonized Guidelines 2021 & APH Ch.6 - Max Ramp Slope 1:12',
      evidenceIds: ['INFRA-06', 'INFRA-07'],
      missingEvidenceIds: ['MISS-02'],
    },
    {
      id: 'FAC-05',
      facilityName: 'Central Administrative Stores & Archive',
      facilityType: 'Administrative & Faculty Offices',
      claimedAreaSqM: 40,
      claimedCapacity: 10,
      roomNumber: 'Store-001',
      buildingBlock: 'Block A Basement',
      status: 'Inconclusive',
      complianceClause: 'APH 2025-26 Ch.6 - Administrative Storage Norms',
      evidenceIds: ['INFRA-08'],
      missingEvidenceIds: [],
    },
    {
      id: 'FAC-06',
      facilityName: 'Automated Fire Suppression Ring & Wet Riser Manifold',
      facilityType: 'Life Safety & Fire Installations',
      claimedAreaSqM: 55,
      claimedCapacity: 0,
      roomNumber: 'Pump House & Ground Manifold',
      buildingBlock: 'Utility Yard North',
      status: 'Deficit Flagged',
      complianceClause: 'National Building Code (NBC) Part IV & APH 2025-26 Ch.6 - Fire Water Reserves',
      evidenceIds: ['INFRA-09'],
      missingEvidenceIds: ['MISS-03'],
    },
  ];

  const evidenceList: InfrastructureEvidence[] = [
    // Evidence 1: Computer Lab Photograph
    {
      id: 'INFRA-01',
      applicationId: 'APP-2025-01',
      institutionName: 'Veermata Jijabai Technological Institute (VJTI) [Synthetic]',
      pid: '1-429810931',
      title: 'Computer Lab 204 Interior & Terminal Layout',
      evidenceType: 'Photograph',
      facilityType: 'Computer Centers & Server Rooms',
      linkedFacilityId: 'FAC-01',
      fileName: 'VJTI_ComputerLab_Room204_FrontView.jpg',
      fileUrl: '/mock/infra/computer_lab_vjti.jpg',
      fileSize: '4.2 MB',
      uploadedAt: '2025-01-14 11:20:00',
      extractedText: 'LAB-204 COMPUTER CENTER • CAPACITY: 60 WORKSTATIONS • DEDICATED 10Gbps LEASED LINE',
      aiClassification: 'Computer Laboratory (Visible IT Infrastructure)',
      aiConfidence: 94.6,
      qualityIssues: [],
      metadataAnomalies: [],
      exifMetadata: {
        cameraMake: 'Sony',
        cameraModel: 'Alpha 7 IV',
        software: 'Firmware 2.0 (Unedited)',
        originalDate: '2025-01-12 14:10:22',
        gpsLatitude: 19.0222,
        gpsLongitude: 72.8561,
        hasGeoTag: true,
      },
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      isDuplicate: false,
      annotations: [
        {
          id: 'ANN-01',
          evidenceId: 'INFRA-01',
          x: 42.5,
          y: 68.0,
          label: 'Aisle Clear Width Check',
          category: 'Safety & Circulation',
          severity: 'Observation',
          notes: 'Clear aisle width between terminal banks measures approximately 1.35m (Compliant with 1.20m norm).',
          annotatedBy: 'AI Vision Assistant (Suggested)',
          timestamp: '2025-01-14 11:22:10',
          isAiSuggestion: true,
          isReviewerConfirmed: true,
        },
        {
          id: 'ANN-02',
          evidenceId: 'INFRA-01',
          x: 88.0,
          y: 22.5,
          label: 'CO2 Fire Extinguisher Station',
          category: 'Fire Safety',
          severity: 'Observation',
          notes: 'Dual 4.5kg CO2 fire extinguisher mounted with active maintenance tag (Inspected Nov 2024).',
          annotatedBy: 'Er. Rajesh V. Patil (Scrutiny Officer)',
          timestamp: '2025-01-15 09:30:00',
          isAiSuggestion: false,
          isReviewerConfirmed: true,
        },
        {
          id: 'ANN-03',
          evidenceId: 'INFRA-01',
          x: 65.0,
          y: 35.0,
          label: 'Potential Unshielded Cable Cluster (AI Detected)',
          category: 'Safety & Circulation',
          severity: 'Minor',
          notes: 'Computer vision flagged bundle of power conductors near work table leg without cable tray.',
          annotatedBy: 'AI Vision Assistant (Suggested)',
          timestamp: '2025-01-14 11:22:15',
          isAiSuggestion: true,
          isReviewerConfirmed: false,
        },
      ],
      reviewHistory: [
        {
          reviewedBy: 'Er. Rajesh V. Patil',
          action: 'Annotated & Approved Supporting Photo',
          timestamp: '2025-01-15 09:35:00',
          notes: 'High-resolution geo-tagged photograph demonstrates terminal layout matching claimed 60 stations.',
        },
      ],
      reviewerVerdict: 'Satisfactory Supporting Evidence',
      reviewerNotes: 'Verified in conjunction with Architect Certified Area Plan (DWG-204-B).',
    },

    // Evidence 2: Architectural CAD Floor Plan for Computer Lab
    {
      id: 'INFRA-02',
      applicationId: 'APP-2025-01',
      institutionName: 'Veermata Jijabai Technological Institute (VJTI) [Synthetic]',
      pid: '1-429810931',
      title: 'Architect Floor Plan: Block B Second Floor (Room 204)',
      evidenceType: 'Floor Plan / Blueprint',
      facilityType: 'Computer Centers & Server Rooms',
      linkedFacilityId: 'FAC-01',
      fileName: 'Architect_Certified_FloorPlan_BlockB_L2.pdf',
      fileUrl: '/mock/infra/floorplan_blockb.pdf',
      fileSize: '8.8 MB',
      uploadedAt: '2025-01-14 11:25:00',
      extractedText: 'ROOM 204: 15.0m x 11.0m = 165.00 SQ.M • CARPET AREA • REGISTERED ARCHITECT SEAL CA/2004/33910',
      aiClassification: 'Architectural Blueprint / CAD Dimension Plan',
      aiConfidence: 98.2,
      qualityIssues: [],
      metadataAnomalies: [],
      exifMetadata: {
        software: 'AutoCAD 2024 / PDF Export',
        originalDate: '2024-11-20 16:00:00',
        hasGeoTag: false,
      },
      sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      isDuplicate: false,
      annotations: [
        {
          id: 'ANN-03',
          evidenceId: 'INFRA-02',
          x: 52.0,
          y: 44.0,
          label: 'Room Dimensions 15.0m x 11.0m',
          category: 'Dimension Audit',
          severity: 'Observation',
          notes: 'Architect seal confirms 165 sq.m carpet area exceeding the 150 sq.m APH requirement.',
          annotatedBy: 'Er. Rajesh V. Patil',
          timestamp: '2025-01-15 09:40:00',
          isAiSuggestion: false,
          isReviewerConfirmed: true,
        },
      ],
      reviewHistory: [
        {
          reviewedBy: 'Er. Rajesh V. Patil',
          action: 'Floor Plan Dimensions Verified',
          timestamp: '2025-01-15 09:45:00',
          notes: 'Cross-referenced against Building Occupancy certificate.',
        },
      ],
      reviewerVerdict: 'Satisfactory Supporting Evidence',
      reviewerNotes: 'Official Architect Certificate confirms carpet area dimensions.',
    },

    // Evidence 3: Heavy Machinery Lab Photo (Quality Issue + Missing Calibration)
    {
      id: 'INFRA-03',
      applicationId: 'APP-2025-06',
      institutionName: 'Shree Swaminarayan Gurukul Polytechnic [Synthetic]',
      pid: '1-710293845',
      title: 'Mechanical Workshop Universal Testing Machine (UTM)',
      evidenceType: 'Photograph',
      facilityType: 'Laboratories & Workshops',
      linkedFacilityId: 'FAC-02',
      fileName: 'Mech_Lab_UTM_Machine_2024.jpg',
      fileUrl: '/mock/infra/mech_utm_machine.jpg',
      fileSize: '1.8 MB',
      uploadedAt: '2025-01-07 14:15:00',
      extractedText: 'UNIVERSAL TESTING MACHINE • MODEL: FIE-UTN-40 • CAPACITY: 400 kN',
      aiClassification: 'Heavy Machinery Laboratory (Visible UTM)',
      aiConfidence: 86.4,
      qualityIssues: ['Low Resolution (<150 DPI)', 'Severe Underexposure'],
      metadataAnomalies: ['Missing Mandatory Geo-tag'],
      exifMetadata: {
        cameraMake: 'Generic Smartphone',
        cameraModel: 'Unknown',
        originalDate: '2023-03-10 11:00:00', // Stale date!
        hasGeoTag: false,
      },
      sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      isDuplicate: false,
      annotations: [
        {
          id: 'ANN-04',
          evidenceId: 'INFRA-03',
          x: 48.0,
          y: 52.0,
          label: 'Expired Calibration Certificate Sticker',
          category: 'Equipment Calibration',
          severity: 'Critical',
          notes: 'NABL calibration sticker displays validity expired in March 2023. Machine has not been recalibrated for 22 months.',
          annotatedBy: 'AI Vision Assistant (Suggested)',
          timestamp: '2025-01-07 14:18:00',
          isAiSuggestion: true,
          isReviewerConfirmed: true,
        },
        {
          id: 'ANN-05',
          evidenceId: 'INFRA-03',
          x: 20.0,
          y: 78.0,
          label: 'Obscured Emergency Safety Shutoff',
          category: 'Safety Compliance',
          severity: 'Major',
          notes: 'Emergency safety power cutoff switch is blocked by storage crates.',
          annotatedBy: 'AI Vision Assistant (Suggested)',
          timestamp: '2025-01-07 14:18:00',
          isAiSuggestion: true,
          isReviewerConfirmed: false,
        },
      ],
      reviewHistory: [
        {
          reviewedBy: 'Er. Sandeep Trivedi',
          action: 'Flagged Critical Deficiency',
          timestamp: '2025-01-08 10:10:00',
          notes: 'Photograph is underexposed and demonstrates expired calibration. Photo alone cannot prove machine is operational.',
        },
      ],
      reviewerVerdict: 'Deficiency Flagged',
      reviewerNotes: 'Issue deficiency notice for updated NABL calibration certificate and safety clearing.',
    },

    // Evidence 4: Duplicate Photo (Apex Horizon duplicate upload)
    {
      id: 'INFRA-04',
      applicationId: 'APP-2025-03',
      institutionName: 'Apex Horizon Institute of Technology & Management [Synthetic]',
      pid: '1-339102948',
      title: 'Workshop Testing Apparatus (Alleged Greater Noida Campus)',
      evidenceType: 'Photograph',
      facilityType: 'Laboratories & Workshops',
      linkedFacilityId: 'FAC-02',
      fileName: 'UTM_Machine_MechanicalLab_BlockC.jpg',
      fileUrl: '/mock/infra/apex_utm_duplicate.jpg',
      fileSize: '1.8 MB',
      uploadedAt: '2025-01-05 16:20:00',
      extractedText: 'UNIVERSAL TESTING MACHINE • MODEL: FIE-UTN-40',
      aiClassification: 'Heavy Machinery Laboratory',
      aiConfidence: 86.4,
      qualityIssues: ['Low Resolution (<150 DPI)'],
      metadataAnomalies: ['Duplicate Photo Collision', 'Photo Editing Software Trace', 'EXIF Timestamp Mismatch'],
      exifMetadata: {
        cameraMake: 'Generic Smartphone',
        cameraModel: 'Unknown',
        software: 'Adobe Photoshop 24.1 (Altered)',
        originalDate: '2023-03-10 11:00:00',
        hasGeoTag: false,
      },
      sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // Exact hash match with INFRA-03!
      isDuplicate: true,
      duplicateOfId: 'INFRA-03',
      annotations: [
        {
          id: 'ANN-06',
          evidenceId: 'INFRA-04',
          x: 50.0,
          y: 50.0,
          label: 'Exact Binary Duplicate Detected (SHA-256 Collision)',
          category: 'Document Integrity',
          severity: 'Critical',
          notes: 'This exact photograph was submitted by another polytechnic in Surat (INFRA-03). Photoshop editing artifacts detected.',
          annotatedBy: 'System Integrity Engine',
          timestamp: '2025-01-05 16:22:00',
          isAiSuggestion: false,
          isReviewerConfirmed: true,
        },
      ],
      reviewHistory: [
        {
          reviewedBy: 'Dr. Vivek Swarup',
          action: 'Flagged Multi-Campus Image Reuse',
          timestamp: '2025-01-06 14:00:00',
          notes: 'Referred to vigilance inquiry for cross-institution stock image recycling.',
        },
      ],
      reviewerVerdict: 'Deficiency Flagged',
      reviewerNotes: 'Photographic fraud suspected. Convene physical EVC inspection.',
    },

    // Evidence 5: Smart Lecture Hall Photo
    {
      id: 'INFRA-05',
      applicationId: 'APP-2025-02',
      institutionName: 'College of Engineering Pune (COEP Tech Univ) [Synthetic]',
      pid: '1-893012741',
      title: 'Smart Lecture Hall LT-101 Tiered Acoustics & AV Podiums',
      evidenceType: 'Photograph',
      facilityType: 'Instructional Area',
      linkedFacilityId: 'FAC-03',
      fileName: 'COEP_SmartClassroom_LT101.jpg',
      fileUrl: '/mock/infra/smart_classroom_coep.jpg',
      fileSize: '5.1 MB',
      uploadedAt: '2025-01-08 10:45:00',
      extractedText: 'LECTURE THEATRE 101 • CAPACITY: 75 SEATS • SMART INTERACTIVE DIGITAL BOARD',
      aiClassification: 'Classroom / Lecture Hall (Tiered Seating)',
      aiConfidence: 96.0,
      qualityIssues: [],
      metadataAnomalies: [],
      exifMetadata: {
        cameraMake: 'Canon',
        cameraModel: 'EOS R6',
        originalDate: '2025-01-07 15:30:00',
        gpsLatitude: 18.5293,
        gpsLongitude: 73.8565,
        hasGeoTag: true,
      },
      sha256Hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      isDuplicate: false,
      annotations: [
        {
          id: 'ANN-07',
          evidenceId: 'INFRA-05',
          x: 48.0,
          y: 35.0,
          label: 'Smart AV Lectern & Dual Displays',
          category: 'Instructional Equipment',
          severity: 'Observation',
          notes: 'Interactive capacitive board and motorized ceiling projector installed.',
          annotatedBy: 'Prof. Aniruddh Joshi',
          timestamp: '2025-01-08 11:00:00',
          isAiSuggestion: false,
          isReviewerConfirmed: true,
        },
      ],
      reviewHistory: [],
      reviewerVerdict: 'Satisfactory Supporting Evidence',
      reviewerNotes: 'Geo-tagged photograph and AV equipment invoice verified.',
    },

    // Evidence 6: Divyangjan Ramp Photo (Excessive Slope Angle)
    {
      id: 'INFRA-06',
      applicationId: 'APP-2025-08',
      institutionName: 'Heritage Institute of Technology [Synthetic]',
      pid: '1-229104859',
      title: 'Central Library Exterior Accessible Approach Ramp',
      evidenceType: 'Photograph',
      facilityType: 'Barrier-Free & Divyangjan Access',
      linkedFacilityId: 'FAC-04',
      fileName: 'Heritage_Library_Ramp_Slope.jpg',
      fileUrl: '/mock/infra/ramp_heritage.jpg',
      fileSize: '3.4 MB',
      uploadedAt: '2025-01-14 10:00:00',
      extractedText: 'DIVYANGJAN BARRIER-FREE ACCESS RAMP • BLOCK A TO LIBRARY TOWER',
      aiClassification: 'Disability Ramp / Exterior Approach',
      aiConfidence: 91.2,
      qualityIssues: ['Distorted Lens Perspective'],
      metadataAnomalies: [],
      exifMetadata: {
        cameraMake: 'Apple',
        cameraModel: 'iPhone 15 Pro',
        originalDate: '2025-01-13 16:45:00',
        gpsLatitude: 22.5186,
        gpsLongitude: 88.4182,
        hasGeoTag: true,
      },
      sha256Hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
      isDuplicate: false,
      annotations: [
        {
          id: 'ANN-08',
          evidenceId: 'INFRA-06',
          x: 55.0,
          y: 65.0,
          label: 'Steep Ramp Gradient (Measured 1:9.5 vs Mandated 1:12)',
          category: 'Accessibility Standard',
          severity: 'Critical',
          notes: 'Photogrammetric angle analysis suggests incline exceeds the mandatory 1:12 maximum slope standard. Handrail is missing along the inner wall.',
          annotatedBy: 'AI Vision Assistant (Suggested)',
          timestamp: '2025-01-14 10:05:00',
          isAiSuggestion: true,
          isReviewerConfirmed: true,
        },
      ],
      reviewHistory: [
        {
          reviewedBy: 'Smt. Kavita Sengupta',
          action: 'Annotated Non-Compliant Gradient',
          timestamp: '2025-01-14 14:20:00',
          notes: 'Gradient appears too steep for wheelchair transit. Physical measurement by EVC committee required.',
        },
      ],
      reviewerVerdict: 'Deficiency Flagged',
      reviewerNotes: 'Requires capital expenditure for ramp re-grading or exterior passenger lift installation.',
    },

    // Evidence 7: Architectural Ramp Section Detail Drawing
    {
      id: 'INFRA-07',
      applicationId: 'APP-2025-08',
      institutionName: 'Heritage Institute of Technology [Synthetic]',
      pid: '1-229104859',
      title: 'Civil Drawing: Accessible Ramp Cross-Section & Longitudinal Profile',
      evidenceType: 'CAD Drawing',
      facilityType: 'Barrier-Free & Divyangjan Access',
      linkedFacilityId: 'FAC-04',
      fileName: 'Civil_Drawing_Ramp_Section_Detail.pdf',
      fileUrl: '/mock/infra/ramp_section_drawing.pdf',
      fileSize: '4.8 MB',
      uploadedAt: '2025-01-14 10:15:00',
      extractedText: 'RAMP SECTION DETAIL • LENGTH: 12.00m • RISE: 1.25m • SLOPE: 1:9.6 • HANDRAIL HEIGHT: 900mm',
      aiClassification: 'Architectural Blueprint / Cross-Sectional Drawing',
      aiConfidence: 95.5,
      qualityIssues: [],
      metadataAnomalies: [],
      exifMetadata: {
        software: 'AutoCAD 2023',
        originalDate: '2024-10-15 12:00:00',
        hasGeoTag: false,
      },
      sha256Hash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
      isDuplicate: false,
      annotations: [
        {
          id: 'ANN-09',
          evidenceId: 'INFRA-07',
          x: 60.0,
          y: 40.0,
          label: 'Slope Specified as 1:9.6 on Blueprint',
          category: 'Norm Non-Compliance',
          severity: 'Critical',
          notes: 'Architect drawing itself explicitly specifies 1:9.6 slope, confirming photographic observation of violation.',
          annotatedBy: 'Smt. Kavita Sengupta',
          timestamp: '2025-01-14 14:30:00',
          isAiSuggestion: false,
          isReviewerConfirmed: true,
        },
      ],
      reviewHistory: [],
      reviewerVerdict: 'Deficiency Flagged',
      reviewerNotes: 'Self-confessed blueprint violation of APH Chapter VI accessibility guidelines.',
    },

    // Evidence 8: Basement Store Room Photo
    {
      id: 'INFRA-08',
      applicationId: 'APP-2025-05',
      institutionName: 'Vanguard College of Architecture & Planning [Synthetic]',
      pid: '1-840192834',
      title: 'Basement Central Stationery & Archives Store Room',
      evidenceType: 'Photograph',
      facilityType: 'Administrative & Faculty Offices',
      linkedFacilityId: 'FAC-05',
      fileName: 'Vanguard_Basement_Store_Photo.jpg',
      fileUrl: '/mock/infra/basement_store.jpg',
      fileSize: '2.5 MB',
      uploadedAt: '2025-01-08 14:00:00',
      extractedText: 'ARCHIVE STORAGE • BLOCK A BASEMENT LEVEL',
      aiClassification: 'Storage Facility (Obscured Boundary)',
      aiConfidence: 78.0,
      qualityIssues: ['Severe Underexposure', 'Obscured Room Boundary'],
      metadataAnomalies: ['Missing Mandatory Geo-tag'],
      exifMetadata: {
        cameraMake: 'Generic',
        cameraModel: 'Unknown',
        hasGeoTag: false,
      },
      sha256Hash: 'b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78',
      isDuplicate: false,
      annotations: [],
      reviewHistory: [],
      reviewerVerdict: 'Inconclusive / Physical EVC Needed',
      reviewerNotes: 'Severe underexposure prevents visual dimension validation. Requires physical visit.',
    },
    // Evidence 9: Main Fire Pump & Hydraulic Valve Assembly Inspection
    {
      id: 'INFRA-09',
      applicationId: 'APP-2025-03',
      institutionName: 'Apex Horizon Institute of Technology & Management [Synthetic]',
      pid: '1-339102948',
      title: 'Main Fire Pump & Hydraulic Valve Assembly Inspection',
      evidenceType: 'Photograph',
      facilityType: 'Life Safety & Fire Installations',
      linkedFacilityId: 'FAC-06',
      fileName: 'Apex_FirePump_House_Inspection.jpg',
      fileUrl: '/mock/infra/fire_pump_apex.jpg',
      fileSize: '3.1 MB',
      uploadedAt: '2025-01-15 14:00:00',
      extractedText: 'DIESEL PUMP 2280 LPM • PRESSURE GAUGE: 7 BAR • CFO ZONE 3 INSPECTION',
      aiClassification: 'Industrial Fire Pump & Piping Infrastructure',
      aiConfidence: 91.2,
      qualityIssues: [],
      metadataAnomalies: ['Missing Mandatory Geo-tag'],
      exifMetadata: {
        cameraMake: 'Samsung',
        cameraModel: 'Galaxy S22',
        originalDate: '2024-09-12 10:15:00',
        hasGeoTag: false,
      },
      sha256Hash: '5e8b1397b98d249c5819e6d4219a16f27dae41846b976d8bcf5c55a556391456',
      isDuplicate: false,
      annotations: [
        {
          id: 'PIN-08',
          evidenceId: 'INFRA-09',
          x: 52,
          y: 44,
          label: 'Missing Mandatory Flow Meter on Test Line',
          category: 'Safety Hazard',
          severity: 'Critical',
          notes: 'NBC Part IV requires calibrated hydraulic flow meter on inspection bypass line.',
          annotatedBy: 'Regional Scrutiny Officer (WRO)',
          timestamp: '2025-01-16 11:00:00',
          isAiSuggestion: false,
          isReviewerConfirmed: true,
        },
      ],
      reviewHistory: [
        {
          reviewedBy: 'AI Optical Ingestion Pipeline',
          action: 'Extracted pumping system entities and detected missing GPS tag',
          timestamp: '2025-01-15 14:00:00',
          notes: 'No geographical location coordinates found in EXIF header.',
        },
      ],
      reviewerVerdict: 'Deficiency Flagged',
      reviewerNotes: 'Photographic filing lacks mandatory GPS coordinate metadata and test flow meter.',
    },
  ];

  const missingEvidenceList: MissingEvidenceItem[] = [
    {
      id: 'MISS-01',
      facilityClaimId: 'FAC-02',
      facilityName: 'Fluid Mechanics & Strength of Materials Laboratory',
      missingEvidenceType: 'NABL Accredited UTM Calibration Certificate (AY 2024-25)',
      reason: 'Uploaded photograph demonstrates calibration expired in March 2023. Valid calibration test report is mandatory.',
      recommendedNextAction: 'Direct institute to upload certified report from an accredited NABL calibration agency with QR code verification.',
      severity: 'Critical',
      recordedBy: 'Er. Sandeep Trivedi',
      timestamp: '2025-01-08 10:15:00',
      resolved: false,
    },
    {
      id: 'MISS-02',
      facilityClaimId: 'FAC-04',
      facilityName: 'Universal Barrier-Free Accessible Ramp & Elevator',
      missingEvidenceType: 'PWD / Municipal Disability Accessibility Compliance Certificate',
      reason: 'Ramp slope is 1:9.6 (exceeding 1:12 standard). Official PWD accessibility sign-off is missing from dossier.',
      recommendedNextAction: 'Request PWD certificate or register deficiency requiring installation of compliant passenger elevator.',
      severity: 'Critical',
      recordedBy: 'Smt. Kavita Sengupta',
      timestamp: '2025-01-14 14:35:00',
      resolved: false,
    },
  ];

  return { facilities, evidenceList, missingEvidenceList };
}
