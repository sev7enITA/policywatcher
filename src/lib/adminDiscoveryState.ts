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
