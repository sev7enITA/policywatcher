import type {
  ExternalIncidentProvider,
  ExternalIncidentProviderDescriptor,
  ExternalIncidentProviderId,
} from './agenticIncidents';
import { rogueAiTrackerProvider } from './providers/rogueAiTracker';

export const EXTERNAL_INCIDENT_PROVIDER_REGISTRY_VERSION = '2026-08-26' as const;

const providers: Readonly<Record<ExternalIncidentProviderId, ExternalIncidentProvider>> = Object.freeze({
  'rogue-ai-tracker': rogueAiTrackerProvider,
});

export function listExternalIncidentProviders(): ExternalIncidentProviderDescriptor[] {
  return Object.values(providers).map((provider) => ({ ...provider.descriptor }));
}

export function getExternalIncidentProvider(id: ExternalIncidentProviderId) {
  return providers[id];
}

export function isExternalIncidentProviderId(value: string): value is ExternalIncidentProviderId {
  return Object.prototype.hasOwnProperty.call(providers, value);
}
