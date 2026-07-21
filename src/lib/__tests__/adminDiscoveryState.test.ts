import { describe, expect, it } from 'vitest';
import { getCronTargetControlState, getDiscoveryUiState } from '../adminDiscoveryState';

describe('getDiscoveryUiState', () => {
  it('keeps a zero-policy company in discovery without a scan action', () => {
    expect(getDiscoveryUiState({
      policyCount: 0,
      candidateCount: 0,
      hasJobState: false,
      hasEstablishedBaseline: false,
      firstScanLaunched: false,
    })).toEqual({
      onboardingActive: true,
      showWorkspace: true,
      showFirstScanAction: false,
      showNormalScanAction: false,
    });
  });

  it('shows only the first-scan action after a discovery approval', () => {
    expect(getDiscoveryUiState({
      policyCount: 1,
      candidateCount: 2,
      hasJobState: true,
      hasEstablishedBaseline: false,
      firstScanLaunched: false,
    })).toMatchObject({
      onboardingActive: true,
      showWorkspace: true,
      showFirstScanAction: true,
      showNormalScanAction: false,
    });
  });

  it('hands off to the normal action as soon as the first scan is launched', () => {
    expect(getDiscoveryUiState({
      policyCount: 1,
      candidateCount: 2,
      hasJobState: true,
      hasEstablishedBaseline: false,
      firstScanLaunched: true,
    })).toMatchObject({
      onboardingActive: false,
      showWorkspace: false,
      showFirstScanAction: false,
      showNormalScanAction: true,
    });
  });

  it('uses the normal scan action for an established company', () => {
    expect(getDiscoveryUiState({
      policyCount: 3,
      candidateCount: 2,
      hasJobState: true,
      hasEstablishedBaseline: true,
      firstScanLaunched: false,
    })).toMatchObject({
      onboardingActive: false,
      showWorkspace: false,
      showNormalScanAction: true,
    });
  });

  it('covers discovery failure and empty-result job states as onboarding', () => {
    expect(getDiscoveryUiState({
      policyCount: 0,
      candidateCount: 0,
      hasJobState: true,
      hasEstablishedBaseline: false,
      firstScanLaunched: false,
    }).showWorkspace).toBe(true);
  });
});

describe('getCronTargetControlState', () => {
  it('never mounts discovery for an established target and keeps scanning available when discovery API is unavailable', () => {
    expect(getCronTargetControlState(2, false)).toEqual({
      mountDiscoveryWorkspace: false,
      showNormalScanAction: true,
    });
  });

  it('mounts discovery for zero-policy onboarding without exposing a scan action', () => {
    expect(getCronTargetControlState(0, true)).toEqual({
      mountDiscoveryWorkspace: true,
      showNormalScanAction: false,
    });
  });

  it('keeps the workspace as the only action after approval until first scan launch', () => {
    expect(getCronTargetControlState(1, true)).toEqual({
      mountDiscoveryWorkspace: true,
      showNormalScanAction: false,
    });
  });

  it('hands an approved target back to normal monitoring after first scan launch', () => {
    expect(getCronTargetControlState(1, false)).toEqual({
      mountDiscoveryWorkspace: false,
      showNormalScanAction: true,
    });
  });
});
