/**
 * PolicyWatcher v2.0 - Email System
 *
 * Nodemailer transport with SMTP configuration from environment variables.
 * Sends policy change alerts and subscription confirmations with branded HTML templates.
 * Falls back to console logging when SMTP is not configured.
 */

import nodemailer from 'nodemailer';

// -- Types --

/** Summary data for a single changed policy, used to build email alert cards. */
export interface ChangedPolicySummary {
  companyName: string;
  policyName: string;
  overallRisk: string;
  overallScore: number;
  summaryEn: string;
  url?: string;
  region: string;
  industry: string;
}

export interface SourceSuspensionAlert {
  companyName: string;
  policyName: string;
  jurisdiction: string;
  status: string;
  reason?: string | null;
  source?: string | null;
  httpStatus?: number | null;
  officialUrl: string;
  checkedAt: Date | string;
}

export interface PolicyInquiryAdminAlert {
  reference: string;
  companyHint?: string | null;
  normalizedDomain?: string | null;
  policyTypes: string[];
  noticeDate?: Date | string | null;
  effectiveDate?: Date | string | null;
  kind: 'verify_existing' | 'unknown_company';
}

// -- Transport Setup --

/**
 * Creates a Nodemailer SMTP transport from environment variables.
 * @returns A configured transport, or `null` if SMTP credentials are missing.
 */
function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Returns the "From" address for outgoing emails.
 * Defaults to the branded noreply address when `SMTP_FROM` is not set.
 */
function getFromAddress(): string {
  return process.env.SMTP_FROM || 'PolicyWatcher <noreply@policywatcher.dev>';
}

function getAdminAlertAddress(): string | null {
  return (
    process.env.ADMIN_ALERT_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_USER ||
    null
  );
}

// -- Risk color helper --

/**
 * Maps a risk level label to its brand hex color for email template styling.
 * @param risk - The risk level string ('High' | 'Medium' | 'Low').
 * @returns A CSS hex color code.
 */
function getRiskColor(risk: string): string {
  switch (risk) {
    case 'High':
      return '#f43f5e';
    case 'Medium':
      return '#f59e0b';
    case 'Low':
      return '#10b981';
    default:
      return '#9ca3af';
  }
}

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildUnsubscribeLink(email?: string, token?: string): string {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  if (!email || !token) return `${appUrl}/unsubscribe`;
  return `${appUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
}

// -- HTML Template Foundation --

/**
 * Wraps inner HTML body content in the branded PolicyWatcher email template
 * with header, footer, and unsubscribe link.
 *
 * @param bodyContent - The inner HTML to place in the email body.
 * @param email - Optional subscriber email for generating the unsubscribe link.
 * @param token - Optional unsubscribe token for secure one-click unsubscription.
 * @returns Complete HTML email string ready for sending.
 */
function wrapInTemplate(bodyContent: string, email?: string, token?: string): string {
  const unsubscribeLink = escapeHtml(buildUnsubscribeLink(email, token));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PolicyWatcher</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060913; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #060913;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; background: linear-gradient(135deg, #6366f1, #818cf8); border-radius: 16px 16px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">PolicyWatcher</h1>
                    <p style="margin: 4px 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.8);">AI Policy Change Monitor</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px; background-color: #111827; border-left: 1px solid rgba(255,255,255,0.08); border-right: 1px solid rgba(255,255,255,0.08);">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0a0e1a; border-radius: 0 0 16px 16px; border: 1px solid rgba(255,255,255,0.05); border-top: none; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                PolicyWatcher by Fabrizio Degni
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #4b5563;">
                <a href="${unsubscribeLink}" style="color: #6366f1; text-decoration: underline;">Unsubscribe</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="https://linkedin.com/in/fabriziodegni" style="color: #6366f1; text-decoration: underline;">LinkedIn</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function wrapOperationalTemplate(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PolicyWatcher Operational Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060913; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #060913;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 24px 32px; background: linear-gradient(135deg, #92400e, #f59e0b); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">PolicyWatcher</h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.84);">Operational QA Alert</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; background-color: #111827; border-left: 1px solid rgba(255,255,255,0.08); border-right: 1px solid rgba(255,255,255,0.08);">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #0a0e1a; border-radius: 0 0 16px 16px; border: 1px solid rgba(255,255,255,0.05); border-top: none; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                Internal operational alert. No user-facing policy data is included in this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendSourceSuspensionAdminAlert(
  alerts: SourceSuspensionAlert[],
  context: 'cron' | 'manual' | 'api' = 'api'
): Promise<boolean> {
  const to = getAdminAlertAddress();
  if (!to) {
    console.log('[PolicyWatcher Mailer] Admin alert recipient not configured. Set ADMIN_ALERT_EMAIL.');
    return false;
  }

  if (alerts.length === 0) return true;

  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const subject =
    alerts.length === 1
      ? `PolicyWatcher QA: source temporarily suspended (${alerts[0].companyName})`
      : `PolicyWatcher QA: ${alerts.length} sources temporarily suspended`;

  const rows = alerts
    .slice(0, 25)
    .map((alert) => {
      const checkedAt = alert.checkedAt instanceof Date ? alert.checkedAt.toISOString() : alert.checkedAt;
      return `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.08); color: #f3f4f6; font-size: 13px;">
            <strong>${escapeHtml(alert.companyName)}</strong><br>
            <span style="color: #9ca3af;">${escapeHtml(alert.policyName)} / ${escapeHtml(alert.jurisdiction)}</span><br>
            <span style="color: #6b7280; word-break: break-all;">${escapeHtml(alert.officialUrl)}</span>
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.08); color: #fbbf24; font-size: 13px;">
            ${escapeHtml(alert.status)}
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.08); color: #9ca3af; font-size: 13px;">
            ${escapeHtml(alert.reason || 'not specified')}<br>
            <span style="color: #6b7280;">${escapeHtml(alert.source || 'none')} / HTTP ${escapeHtml(alert.httpStatus ?? 'n/a')}</span>
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.08); color: #9ca3af; font-size: 12px;">
            ${escapeHtml(checkedAt)}
          </td>
        </tr>`;
    })
    .join('');

  const hiddenCount = Math.max(0, alerts.length - 25);
  const dashboardUrl = `${appUrl.replace(/\/+$/, '')}/admin/dataset-quality`;

  const bodyContent = `
    <p style="margin: 0 0 18px; font-size: 15px; color: #f3f4f6; line-height: 1.6;">
      PolicyWatcher detected source-quality anomalies during a <strong>${escapeHtml(context)}</strong> scan.
      The affected sources have been treated as temporarily suspended: public views should expose only the suspension notice and minimal metadata until the source is reviewed or successfully fetched again.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 18px;">
      <thead>
        <tr>
          <th align="left" style="padding: 8px; color: #f3f4f6; font-size: 12px; text-transform: uppercase;">Source</th>
          <th align="left" style="padding: 8px; color: #f3f4f6; font-size: 12px; text-transform: uppercase;">Status</th>
          <th align="left" style="padding: 8px; color: #f3f4f6; font-size: 12px; text-transform: uppercase;">Reason</th>
          <th align="left" style="padding: 8px; color: #f3f4f6; font-size: 12px; text-transform: uppercase;">Checked</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${
      hiddenCount > 0
        ? `<p style="margin: 0 0 16px; font-size: 13px; color: #fbbf24;">${hiddenCount} additional suspended sources are not shown in this email summary.</p>`
        : ''
    }
    <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">
      Review the Dataset QA console: <a href="${escapeHtml(dashboardUrl)}" style="color: #818cf8; text-decoration: underline;">${escapeHtml(dashboardUrl)}</a>
    </p>`;

  return sendEmail(to, subject, wrapOperationalTemplate(bodyContent));
}

/**
 * Notifies the operator after a new privacy-minimized inquiry was persisted.
 * The raw notification, its subject, addresses and content fingerprints are
 * never accepted by this function and therefore cannot enter the email.
 */
export async function sendPolicyInquiryAdminAlert(
  inquiry: PolicyInquiryAdminAlert,
): Promise<boolean> {
  const to = getAdminAlertAddress();
  if (!to) {
    console.log('[PolicyWatcher Mailer] Admin alert recipient not configured. The inquiry remains available in /admin/inquiries.');
    return false;
  }

  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const dashboardUrl = `${appUrl.replace(/\/+$/, '')}/admin/inquiries`;
  const company = (inquiry.companyHint || inquiry.normalizedDomain || 'Company not identified')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 160);
  const policyTypes = inquiry.policyTypes.length > 0 ? inquiry.policyTypes.join(', ') : 'not specified';
  const dateValue = (value?: Date | string | null) => value instanceof Date ? value.toISOString() : value || 'not specified';
  const subject = `PolicyWatcher inquiry ${inquiry.reference}: ${company}`;
  const bodyContent = `
    <p style="margin: 0 0 18px; font-size: 15px; color: #f3f4f6; line-height: 1.6;">
      A new privacy-minimized policy inquiry was saved and is ready for human review.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 18px; color: #d1d5db; font-size: 13px; line-height: 1.6;">
      <tr><td style="padding: 7px 0; color: #9ca3af; width: 150px;">Reference</td><td><strong>${escapeHtml(inquiry.reference)}</strong></td></tr>
      <tr><td style="padding: 7px 0; color: #9ca3af;">Company/domain</td><td>${escapeHtml(company)}</td></tr>
      <tr><td style="padding: 7px 0; color: #9ca3af;">Request type</td><td>${escapeHtml(inquiry.kind)}</td></tr>
      <tr><td style="padding: 7px 0; color: #9ca3af;">Policy categories</td><td>${escapeHtml(policyTypes)}</td></tr>
      <tr><td style="padding: 7px 0; color: #9ca3af;">Notice date</td><td>${escapeHtml(dateValue(inquiry.noticeDate))}</td></tr>
      <tr><td style="padding: 7px 0; color: #9ca3af;">Effective date</td><td>${escapeHtml(dateValue(inquiry.effectiveDate))}</td></tr>
    </table>
    <p style="margin: 0 0 12px; font-size: 13px; color: #9ca3af; line-height: 1.6;">
      The notification text, subject, sender, recipient and content fingerprint were not collected.
    </p>
    <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">
      Review the admin queue: <a href="${escapeHtml(dashboardUrl)}" style="color: #818cf8; text-decoration: underline;">${escapeHtml(dashboardUrl)}</a>
    </p>`;

  return sendEmail(to, subject, wrapOperationalTemplate(bodyContent));
}

// -- Policy Change Alert --

/**
 * Sends an alert email to a subscriber about changed policies.
 * Falls back to console.log if SMTP is not configured.
 */
export async function sendPolicyChangeAlert(
  subscriberEmail: string,
  subscriberName: string | undefined,
  changedPolicies: ChangedPolicySummary[],
  token?: string
): Promise<boolean> {
  const greeting = subscriberName ? `Hello ${escapeHtml(subscriberName)}` : 'Hello';
  const count = changedPolicies.length;
  const subject = `PolicyWatcher Alert: ${count} polic${count === 1 ? 'y' : 'ies'} updated`;

  // Build change cards
  const cards = changedPolicies
    .map((p) => {
      const riskColor = getRiskColor(p.overallRisk);
      const companyName = escapeHtml(p.companyName);
      const policyName = escapeHtml(p.policyName);
      const overallRisk = escapeHtml(p.overallRisk);
      const overallScore = escapeHtml(p.overallScore);
      const summaryEn = escapeHtml(p.summaryEn);
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
          <tr>
            <td style="padding: 16px; background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid ${riskColor}; border-radius: 10px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #f3f4f6;">${companyName} - ${policyName}</p>
                    <p style="margin: 0 0 8px; font-size: 12px; color: ${riskColor}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                      Risk: ${overallRisk} (${overallScore}/10)
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5;">${summaryEn}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
    })
    .join('');

  const bodyContent = `
    <p style="margin: 0 0 20px; font-size: 15px; color: #f3f4f6; line-height: 1.6;">
      ${greeting},<br><br>
      PolicyWatcher has detected changes in <strong>${count}</strong> monitored polic${count === 1 ? 'y' : 'ies'}. Below is a summary of the updates:
    </p>
    ${cards}
    <p style="margin: 20px 0 0; font-size: 13px; color: #6b7280;">
      Visit the PolicyWatcher dashboard for full analysis, regional impact assessments, and remediation steps.
    </p>`;

  const html = wrapInTemplate(bodyContent, subscriberEmail, token);
  return sendEmail(subscriberEmail, subject, html);
}

// -- Subscription Confirmation --

/**
 * Sends a welcome email confirming a new subscription.
 * Falls back to console.log if SMTP is not configured.
 */
export async function sendSubscriptionConfirmation(
  email: string,
  name: string | undefined,
  regions: string,
  industries: string,
  frequency: string,
  token?: string
): Promise<boolean> {
  const greeting = name ? `Hello ${escapeHtml(name)}` : 'Hello';
  const subject = 'Welcome to PolicyWatcher Alerts';

  const freqLabel = frequency === 'WEEKLY' ? 'Weekly Digest' : 'Real-time Alerts';
  const unsubscribeLink = escapeHtml(buildUnsubscribeLink(email, token));

  const bodyContent = `
    <p style="margin: 0 0 20px; font-size: 15px; color: #f3f4f6; line-height: 1.6;">
      ${greeting},<br><br>
      Your subscription to PolicyWatcher alerts has been confirmed. You will receive notifications based on your chosen preferences.
    </p>
    
    <!-- Subscription Preferences Summary -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px;">
          <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.05em;">Your Subscription Details</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #9ca3af; line-height: 1.6;">
            <tr>
              <td style="padding: 4px 0; font-weight: 600; color: #f3f4f6; width: 140px;">Regions:</td>
              <td style="padding: 4px 0;">${escapeHtml(regions)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600; color: #f3f4f6;">Industries:</td>
              <td style="padding: 4px 0;">${escapeHtml(industries)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600; color: #f3f4f6;">Frequency:</td>
              <td style="padding: 4px 0;">${escapeHtml(freqLabel)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background-color: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 10px;">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #f3f4f6;">What you will receive:</p>
          <ul style="margin: 0; padding-left: 20px; color: #9ca3af; font-size: 13px; line-height: 1.8;">
            <li>AI-powered risk analysis and policy alerts</li>
            <li>AI governance indicator updates (training opt-out, data scraping, etc.)</li>
            <li>Actionable compliance remediation steps for enterprises and individuals</li>
          </ul>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 20px; font-size: 13px; color: #9ca3af; line-height: 1.5;">
      <strong>How to Unsubscribe:</strong> If you ever wish to stop receiving updates, simply click the <strong>Unsubscribe</strong> link at the bottom of any email we send you, or click here: <a href="${unsubscribeLink}" style="color: #6366f1; text-decoration: underline;">Cancel Subscription</a>.
    </p>

    <p style="margin: 0; font-size: 13px; color: #6b7280;">
      Thank you for using PolicyWatcher.<br>
      -- Fabrizio Degni
    </p>`;

  const html = wrapInTemplate(bodyContent, email, token);
  return sendEmail(email, subject, html);
}

// -- Monthly Digest --

/**
 * Sends a monthly digest email to a subscriber.
 */
export async function sendMonthlyDigest(
  subscriberEmail: string,
  subscriberName: string | undefined,
  recentChanges: ChangedPolicySummary[],
  token?: string
): Promise<boolean> {
  const greeting = subscriberName ? `Hello ${escapeHtml(subscriberName)}` : 'Hello';
  const count = recentChanges.length;
  const subject = `PolicyWatcher Monthly Digest: ${count} updates in the last 30 days`;

  let cards = '';
  if (count === 0) {
    cards = `
      <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5;">
        There have been no significant policy changes recorded in the last 30 days.
      </p>`;
  } else {
    cards = recentChanges
      .map((p) => {
        const riskColor = getRiskColor(p.overallRisk);
        const companyName = escapeHtml(p.companyName);
        const policyName = escapeHtml(p.policyName);
        const overallRisk = escapeHtml(p.overallRisk);
        const overallScore = escapeHtml(p.overallScore);
        const region = escapeHtml(p.region);
        const summaryEn = escapeHtml(p.summaryEn);
        return `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
            <tr>
              <td style="padding: 16px; background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid ${riskColor}; border-radius: 10px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #f3f4f6;">${companyName} - ${policyName}</p>
                      <p style="margin: 0 0 8px; font-size: 12px; color: ${riskColor}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                        Risk: ${overallRisk} (${overallScore}/10) | Region: ${region}
                      </p>
                      <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5;">${summaryEn}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>`;
      })
      .join('');
  }

  const bodyContent = `
    <p style="margin: 0 0 20px; font-size: 15px; color: #f3f4f6; line-height: 1.6;">
      ${greeting},<br><br>
      Here is your monthly PolicyWatcher digest summarizing policy updates from the last 30 days:
    </p>
    ${cards}
    <p style="margin: 20px 0 0; font-size: 13px; color: #6b7280;">
      Visit the PolicyWatcher dashboard for full interactive timelines and detailed comparison diffs.
    </p>`;

  const html = wrapInTemplate(bodyContent, subscriberEmail, token);
  return sendEmail(subscriberEmail, subject, html);
}

// -- Weekly Digest --

/**
 * Sends a weekly digest email to a subscriber.
 */
export async function sendWeeklyDigest(
  subscriberEmail: string,
  subscriberName: string | undefined,
  recentChanges: ChangedPolicySummary[],
  token?: string
): Promise<boolean> {
  const greeting = subscriberName ? `Hello ${escapeHtml(subscriberName)}` : 'Hello';
  const count = recentChanges.length;
  const subject = `PolicyWatcher Weekly Digest: ${count} updates in the last 7 days`;

  let cards = '';
  if (count === 0) {
    cards = `
      <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5;">
        There have been no significant policy changes recorded in the last 7 days.
      </p>`;
  } else {
    cards = recentChanges
      .map((p) => {
        const riskColor = getRiskColor(p.overallRisk);
        const companyName = escapeHtml(p.companyName);
        const policyName = escapeHtml(p.policyName);
        const overallRisk = escapeHtml(p.overallRisk);
        const overallScore = escapeHtml(p.overallScore);
        const region = escapeHtml(p.region);
        const summaryEn = escapeHtml(p.summaryEn);
        return `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
            <tr>
              <td style="padding: 16px; background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid ${riskColor}; border-radius: 10px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #f3f4f6;">${companyName} - ${policyName}</p>
                      <p style="margin: 0 0 8px; font-size: 12px; color: ${riskColor}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                        Risk: ${overallRisk} (${overallScore}/10) | Region: ${region}
                      </p>
                      <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5;">${summaryEn}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>`;
      })
      .join('');
  }

  const bodyContent = `
    <p style="margin: 0 0 20px; font-size: 15px; color: #f3f4f6; line-height: 1.6;">
      ${greeting},<br><br>
      Here is your weekly PolicyWatcher digest summarizing policy updates from the last 7 days:
    </p>
    ${cards}
    <p style="margin: 20px 0 0; font-size: 13px; color: #6b7280;">
      Visit the PolicyWatcher dashboard for full interactive timelines and detailed comparison diffs.
    </p>`;

  const html = wrapInTemplate(bodyContent, subscriberEmail, token);
  return sendEmail(subscriberEmail, subject, html);
}

// -- Core Send --

/**
 * Core email dispatch function. Attempts SMTP delivery and falls back
 * to console logging when SMTP is not configured.
 *
 * @param to - Recipient email address.
 * @param subject - Email subject line.
 * @param html - Complete HTML email body.
 * @returns `true` if the email was sent successfully, `false` otherwise.
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const transport = createTransport();

  if (!transport) {
    console.log('[PolicyWatcher Mailer] SMTP not configured. Email not sent.');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body length: ${html.length} chars`);
    return false;
  }

  try {
    await transport.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html,
    });
    console.log(`[PolicyWatcher Mailer] Email sent to ${to}: "${subject}"`);
    return true;
  } catch (error) {
    console.error('[PolicyWatcher Mailer] Failed to send email:', error);
    return false;
  }
}
