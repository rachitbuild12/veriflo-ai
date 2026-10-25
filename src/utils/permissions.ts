/**
 * Veriflo AI - GovTech Role-Based Access Control (RBAC) & Permissions Engine
 * 
 * Clearance Hierarchy:
 * - Level 4: Senior Director (Approval Bureau) - Full regulatory grant & policy power
 * - Level 3: Standing Appellate Committee Member - Quasi-judicial review & appellate overrides
 * - Level 2: Regional Scrutiny Officer (WRO) - Primary AI scrutiny, deficiency notices, manual checks
 * - Level 1: System Auditor / Vigilance Officer - Forensic audit, tamper review, immutable logs
 */

import { OfficerRole } from '../types';

export interface RolePermissions {
  canApproveEoA: boolean;
  canRejectApplication: boolean;
  canIssueDeficiencyNotice: boolean;
  canOverrideTamperAlert: boolean;
  canModifyComplianceRules: boolean;
  canPerformManualVerification: boolean;
  canGenerateFinalEoA: boolean;
  canAccessVigilanceLogs: boolean;
  canSimulateScenarios: boolean;
  clearanceLevel: string;
  description: string;
}

export const ROLE_PERMISSIONS_MAP: Record<OfficerRole, RolePermissions> = {
  'Senior Director (Approval Bureau)': {
    canApproveEoA: true,
    canRejectApplication: true,
    canIssueDeficiencyNotice: true,
    canOverrideTamperAlert: true,
    canModifyComplianceRules: true,
    canPerformManualVerification: true,
    canGenerateFinalEoA: true,
    canAccessVigilanceLogs: true,
    canSimulateScenarios: true,
    clearanceLevel: 'Level 4 - National Bureau Chief',
    description: 'Supreme regulatory authority empowered to grant final EoA, modify national norms, and execute ministerial approvals.',
  },
  'Standing Appellate Committee Member': {
    canApproveEoA: true,
    canRejectApplication: true,
    canIssueDeficiencyNotice: true,
    canOverrideTamperAlert: true,
    canModifyComplianceRules: false,
    canPerformManualVerification: true,
    canGenerateFinalEoA: true,
    canAccessVigilanceLogs: true,
    canSimulateScenarios: true,
    clearanceLevel: 'Level 3 - Quasi-Judicial Appeals Authority',
    description: 'Empowered to adjudicate contested deficiency notices, review institutional appeals, and modify regional verdicts.',
  },
  'Regional Scrutiny Officer (WRO)': {
    canApproveEoA: false, // Must escalate to Approval Bureau
    canRejectApplication: false, // Requires Bureau Director sign-off
    canIssueDeficiencyNotice: true,
    canOverrideTamperAlert: true,
    canModifyComplianceRules: false,
    canPerformManualVerification: true,
    canGenerateFinalEoA: false,
    canAccessVigilanceLogs: false,
    canSimulateScenarios: true,
    clearanceLevel: 'Level 2 - Regional Scrutiny Authority',
    description: 'Executes primary document verification, issues statutory 15-day deficiency notices, and conducts manual issuer cross-checks.',
  },
  'System Auditor / Vigilance Officer': {
    canApproveEoA: false,
    canRejectApplication: false,
    canIssueDeficiencyNotice: false,
    canOverrideTamperAlert: false,
    canModifyComplianceRules: false,
    canPerformManualVerification: true,
    canGenerateFinalEoA: false,
    canAccessVigilanceLogs: true,
    canSimulateScenarios: true,
    clearanceLevel: 'Level 1 - Central Vigilance & Forensics',
    description: 'Monitors forensic tamper signals, cross-campus photo collisions, audit log SHA-256 integrity, and officer overrides.',
  },
};

export function getRolePermissions(role: OfficerRole): RolePermissions {
  return ROLE_PERMISSIONS_MAP[role] || ROLE_PERMISSIONS_MAP['Regional Scrutiny Officer (WRO)'];
}

export function assertPermission(
  role: OfficerRole,
  permission: keyof RolePermissions
): { allowed: boolean; reason?: string } {
  const perms = getRolePermissions(role);
  if (perms[permission]) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Clearance Denied: ${role} (${perms.clearanceLevel}) does not possess '${String(permission)}' authorization. Action requires executive escalation.`,
  };
}
