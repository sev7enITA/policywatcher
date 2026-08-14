export interface DiscoveryUiStateInput {
  policyCount: number;
  candidateCount: number;
  hasJobState: boolean;
  hasEstablishedBaseline: boolean;
  firstScanLaunched: boolean;
}

export interface DiscoveryUiState {
  onboardingActive: boolean;
  showWorkspace: boolean;
  showFirstScanAction: boolean;
  showNormalScanAction: boolean;
}

export interface CronTargetControlState {
  mountDiscoveryWorkspace: boolean;
  showNormalScanAction: boolean;
}

export interface CompanyBaselinePolicyState {
  currentHash?: string | null;
  lastSuccessfulCheckDate?: string | null;
  dataStatus?: string | null;
  _count?: { snapshots?: number | null } | null;
  snapshots?: readonly unknown[] | null;
}

export function hasEstablishedCompanyBaseline(
  policies: CompanyBaselinePolicyState[]
): boolean {
  return policies.length > 0 && policies.every((policy) => {
    const status = (policy.dataStatus || '').trim().toLowerCase();
    const snapshotCount = policy.snapshots
      ? policy.snapshots.length
      : (policy._count?.snapshots || 0);
    return Boolean(
      policy.currentHash
      && policy.lastSuccessfulCheckDate
      && snapshotCount > 0
      && ['available', 'reviewed'].includes(status)
    );
  });
}

export function getCronTargetControlState(
  policyCount: number,
  onboardingActive: boolean
): CronTargetControlState {
  return {
    mountDiscoveryWorkspace: onboardingActive,
    showNormalScanAction: policyCount > 0 && !onboardingActive,
  };
}

export function getDiscoveryUiState({
  policyCount,
  candidateCount,
  hasJobState,
  hasEstablishedBaseline,
  firstScanLaunched,
}: DiscoveryUiStateInput): DiscoveryUiState {
  const hasDiscoveryHistory = candidateCount > 0 || hasJobState;
  const onboardingActive = !firstScanLaunched
    && !hasEstablishedBaseline
    && (policyCount === 0 || hasDiscoveryHistory);

  return {
    onboardingActive,
    showWorkspace: onboardingActive,
    showFirstScanAction: onboardingActive && policyCount > 0,
    showNormalScanAction: policyCount > 0 && !onboardingActive,
  };
}
