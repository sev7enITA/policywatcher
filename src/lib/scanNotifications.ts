import { db } from './db';
import { sendPolicyChangeAlert, sendSourceSuspensionAdminAlert, maskEmailForLog, type ChangedPolicySummary, type SourceSuspensionAlert } from './mailer';
import { normalizePreferenceKey, splitPreferenceKeys } from './subscriberPreferences';

/** A silent maintenance scan never reads recipients or invokes either mail path. */
export async function deliverScanNotifications(
  notificationMode: 'silent' | 'subscribers',
  changedPolicySummaries: ChangedPolicySummary[],
  suspendedSourceAlerts: SourceSuspensionAlert[],
) {
  if (notificationMode === 'silent') return;
  if (suspendedSourceAlerts.length > 0) {
    try {
      await sendSourceSuspensionAdminAlert(suspendedSourceAlerts, 'cron');
    } catch (mailError) {
      console.error('[Cron] Failed to send source suspension admin alert:', mailError);
    }
  }

  // Notify subscribers if any policies changed
  if (changedPolicySummaries.length > 0) {
    try {
      const activeSubscribers = await db.subscriber.findMany({
        where: { 
          isActive: true,
          frequency: 'INSTANT'
        },
      });

      console.log(
        `[Cron] Processing notifications for ${activeSubscribers.length} subscribers.`
      );

      for (const subscriber of activeSubscribers) {
        // Filter changes relevant to subscriber's regions/industries
        const subscriberRegions = splitPreferenceKeys(subscriber.regions);
        const subscriberIndustries = splitPreferenceKeys(subscriber.industries);

        const filteredChanges = changedPolicySummaries.filter(p => {
          const hasRegion = subscriberRegions.includes(normalizePreferenceKey(p.region));
          const hasIndustry = subscriberIndustries.includes(normalizePreferenceKey(p.industry));
          return hasRegion && hasIndustry;
        });

        if (filteredChanges.length === 0) {
          console.log(`[Cron] Skipping subscriber ${maskEmailForLog(subscriber.email)}: no matching changes based on configured regions or industries.`);
          continue;
        }

        try {
          await sendPolicyChangeAlert(
            subscriber.email,
            subscriber.name || undefined,
            filteredChanges,
            subscriber.unsubscribeToken
          );
        } catch (mailError) {
          const errorType = mailError instanceof Error ? mailError.name : 'UnknownError';
          console.error(`[Cron] Failed to notify ${maskEmailForLog(subscriber.email)} (${errorType}).`);
        }
      }
    } catch (subscriberError) {
      console.error('[Cron] Error fetching subscribers:', subscriberError);
    }
  }

}
