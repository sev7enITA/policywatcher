import { db } from '../db';
import { readArtifact, type TaskInput } from './store';
import type { Observation } from './acquisition';
import type { ChannelMetadata } from '../scanChannels';
import type { compareCapturedExtraction } from './comparison';

export async function recentChannelRuns() {
  const runs = await db.engineRun.findMany({ where: { channelMetadataJson: { not: null } }, orderBy: { createdAt: 'desc' }, take: 10 });
  return runs.map(run => ({ id: run.id, channel: (JSON.parse(run.channelMetadataJson!) as ChannelMetadata).channel,
    status: run.status, selected: run.selected, createdAt: run.createdAt, completedAt: run.completedAt }));
}

/** Private, bounded report. No live re-extraction: comparisons were frozen by the worker. */
export async function channelRunReport(id: string) {
  const run = await db.engineRun.findUnique({ where: { id }, include: { tasks: { orderBy: { createdAt: 'asc' } } } });
  if (!run?.channelMetadataJson) return null;
  const metadata = JSON.parse(run.channelMetadataJson) as ChannelMetadata;
  const fetches = new Map(run.tasks.filter(task => task.kind === 'fetch').map(task => [task.id, task]));
  const rows = [];
  for (const task of run.tasks.filter(task => task.kind === 'policy')) {
    const input = JSON.parse(task.inputJson) as TaskInput;
    const fetch = fetches.get(task.dependencyId || '');
    const observation = fetch?.resultJson ? JSON.parse(fetch.resultJson) as Observation & { comparisonArtifactId?: string } : null;
    const comparison = observation?.comparisonArtifactId
      ? await readArtifact<ReturnType<typeof compareCapturedExtraction>>(observation.comparisonArtifactId) : null;
    const checkpoint = task.checkpointJson ? JSON.parse(task.checkpointJson) : null;
    const result = task.resultJson ? JSON.parse(task.resultJson) : null;
    const comparisonState = metadata.channel !== 'compare' ? 'not_requested'
      : comparison ? (comparison.identicalText ? 'identical_unqualified' : 'different')
        : fetch && ['queued', 'blocked', 'running'].includes(fetch.status) ? 'pending' : 'unavailable';
    rows.push({ taskId: task.id, policyId: task.policyId, sourceUrl: input.sourceUrl, baselineHash: task.expectedBaselineHash,
      scopeHash: input.scopeHash, contractHash: input.contractHash, profileHash: input.profileHash,
      status: task.status, stage: task.stage, outcome: result?.outcome || null,
      reasons: result?.reasons || observation?.reasons || [], error: task.lastError || fetch?.lastError || null,
      acquisition: observation ? { observedAt: observation.observedAt, httpStatus: observation.httpStatus,
        finalUrl: observation.finalUrl, source: observation.source, eligible: observation.eligible,
        artifactId: observation.artifactId } : null,
      comparisonState, comparisonArtifactId: observation?.comparisonArtifactId || null, comparison,
      analysisReceipt: checkpoint?.analysis?.receipt || null, verifierReceipt: checkpoint?.verification?.receipt || null });
  }
  return { schema: 'pw-channel-report-1', runId: run.id, requestKey: run.requestKey,
    metadata,
    comparisonCounts: { policyRows: rows.length, compared: rows.filter(row => row.comparison).length,
      identicalUnqualified: rows.filter(row => row.comparisonState === 'identical_unqualified').length,
      different: rows.filter(row => row.comparisonState === 'different').length,
      pending: rows.filter(row => row.comparisonState === 'pending').length,
      unavailable: rows.filter(row => row.comparisonState === 'unavailable').length,
      notRequested: rows.filter(row => row.comparisonState === 'not_requested').length },
    status: run.status, selected: run.selected, createdAt: run.createdAt, completedAt: run.completedAt,
    elapsedMs: run.completedAt ? run.completedAt.getTime() - run.createdAt.getTime() : null,
    mode: run.mode, notifications: run.notificationMode, rows,
    boundary: 'Private experimental run. Completion does not imply source completeness. Comparison covers extraction of the same decoded capture, not both end-to-end scanners or AI models. No automatic fallback to the stable scanner.' };
}
