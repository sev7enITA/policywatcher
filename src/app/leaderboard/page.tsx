import type { Metadata } from 'next';
import Link from 'next/link';
import { buildLeaderboard, type LeaderboardRow, type LeaderboardSnapshot } from '@/lib/leaderboard';
import { getLeaderboardSnapshot } from '@/lib/leaderboardData';
import styles from './leaderboard.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Policy Signals Board | PolicyWatcher',
  description:
    'Evidence-only leaderboard for public policy-source coverage, retrieval traceability, and publicEvidence-gated movement.',
};

const mixLabels: Array<[keyof LeaderboardRow['retrievalMix'], string]> = [
  ['direct', 'Direct'],
  ['http2', 'HTTP/2'],
  ['rendered', 'VPS'],
  ['archive', 'Archive'],
  ['seeded', 'Seeded'],
  ['none', 'None'],
];

function formatDate(value: string | null): string {
  if (!value) return 'No verified timestamp';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatCompactDate(value: string | null): string {
  if (!value) return 'n/a';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function tierClass(tier: LeaderboardRow['tier']): string {
  if (tier === 'Evidence-ready') return styles.tierReady;
  if (tier === 'Watchlist') return styles.tierWatch;
  if (tier === 'Suspended') return styles.tierSuspended;
  return styles.tierInventory;
}

function sourceTotal(row: LeaderboardRow): number {
  return Object.values(row.retrievalMix).reduce((sum, count) => sum + count, 0);
}

function MixBar({ row }: { row: LeaderboardRow }) {
  const total = Math.max(1, sourceTotal(row));

  return (
    <div className={styles.mixBar} aria-label={`Retrieval mix for ${row.name}`}>
      {mixLabels.map(([key, label]) => {
        const count = row.retrievalMix[key];
        if (count === 0) return null;
        return (
          <span
            key={key}
            className={`${styles.mixSegment} ${styles[`mix${key}`]}`}
            style={{ width: `${Math.max(10, (count / total) * 100)}%` }}
            title={`${label}: ${count}`}
          />
        );
      })}
    </div>
  );
}

function MetricTile({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className={styles.metricTile}>
      <span className={styles.metricLabel}>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function PodiumCard({ row }: { row: LeaderboardRow }) {
  return (
    <article className={styles.podiumCard}>
      <div className={styles.podiumRank}>#{row.rank}</div>
      <div>
        <span className={`${styles.tierBadge} ${tierClass(row.tier)}`}>{row.tier}</span>
        <h3>{row.name}</h3>
        <p>{row.industry}</p>
      </div>
      <div className={styles.indexGauge}>
        <span style={{ transform: `rotate(${Math.min(180, row.evidenceIndex * 1.8)}deg)` }} />
        <strong>{row.evidenceIndex}</strong>
        <small>evidence index</small>
      </div>
      <dl className={styles.compactStats}>
        <div>
          <dt>Verified policies</dt>
          <dd>
            {row.verifiedPolicyCount}/{row.policyCount}
          </dd>
        </div>
        <div>
          <dt>Source logs</dt>
          <dd>{row.sourceEvidenceCount}</dd>
        </div>
        <div>
          <dt>Latest fetch</dt>
          <dd>{formatCompactDate(row.latestSuccessfulFetchAt)}</dd>
        </div>
      </dl>
      <MixBar row={row} />
    </article>
  );
}

function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <div className={styles.emptyState}>
        No source-verified leaderboard rows are available yet.
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.boardTable}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Company</th>
            <th>Evidence index</th>
            <th>Verified policies</th>
            <th>Retrieval mix</th>
            <th>Public movement</th>
            <th>Latest source evidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.companyId}>
              <td>
                <span className={styles.rankPill}>#{row.rank}</span>
              </td>
              <td>
                <div className={styles.companyCell}>
                  <strong>{row.name}</strong>
                  <span>{row.industry}</span>
                  <span className={`${styles.tierBadge} ${tierClass(row.tier)}`}>{row.tier}</span>
                </div>
              </td>
              <td>
                <div className={styles.indexCell}>
                  <strong>{row.evidenceIndex}</strong>
                  <span>0-99 operational scale</span>
                </div>
              </td>
              <td>
                {row.verifiedPolicyCount}/{row.policyCount}
                {row.suspendedPolicyCount > 0 && (
                  <small className={styles.inlineWarning}>
                    {row.suspendedPolicyCount} suspended
                  </small>
                )}
              </td>
              <td>
                <MixBar row={row} />
                <div className={styles.mixLegend}>
                  {mixLabels.map(([key, label]) => (
                    <span key={key}>
                      {label}: {row.retrievalMix[key]}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <strong>{row.publicChangeCount}</strong>
                <small>
                  {row.averageChangeSignal === null
                    ? 'no publicEvidence movement'
                    : `avg signal ${row.averageChangeSignal}/10`}
                </small>
              </td>
              <td>
                <time>{formatDate(row.latestSuccessfulFetchAt)}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MovementBoard({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <div className={styles.emptyState}>
        No publicEvidence-gated movement is currently available.
      </div>
    );
  }

  return (
    <div className={styles.movementGrid}>
      {rows.slice(0, 6).map((row) => (
        <article key={row.companyId} className={styles.movementCard}>
          <div>
            <span>#{row.rank}</span>
            <h3>{row.name}</h3>
            <p>{row.industry}</p>
          </div>
          <strong>{row.publicChangeCount}</strong>
          <small>public change records</small>
          <time>{formatCompactDate(row.latestChangeAt)}</time>
        </article>
      ))}
    </div>
  );
}

function AttentionBoard({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <div className={styles.emptyState}>
        No suspended source group is currently visible in the leaderboard snapshot.
      </div>
    );
  }

  return (
    <div className={styles.attentionList}>
      {rows.slice(0, 8).map((row) => (
        <article key={row.companyId} className={styles.attentionRow}>
          <div>
            <span className={`${styles.tierBadge} ${tierClass(row.tier)}`}>{row.tier}</span>
            <h3>{row.name}</h3>
            <p>{row.notes[0] || 'Source evidence requires review before public use.'}</p>
          </div>
          <strong>{row.suspendedPolicyCount}</strong>
        </article>
      ))}
    </div>
  );
}

export default async function LeaderboardPage() {
  let snapshot: LeaderboardSnapshot;
  let dbUnavailable = false;

  try {
    snapshot = await getLeaderboardSnapshot();
  } catch (error) {
    console.error('Unable to render leaderboard:', error);
    snapshot = buildLeaderboard([]);
    dbUnavailable = true;
  }

  const topEvidence = snapshot.boards.evidence.slice(0, 3);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.navLine}>
          <Link href="/" className={styles.brandLink}>
            <span className={styles.brandMark} />
            <span>PolicyWatcher</span>
          </Link>
          <div className={styles.navActions}>
            <Link href="/trust">Trust QA</Link>
            <Link href="/methodology/confidence">Methodology</Link>
            <Link href="/showcase">Showcase</Link>
          </div>
        </div>

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Evidence-only public board</span>
            <h1>Policy Signals Board</h1>
            <p>
              A leaderboard for observable source coverage, retrieval traceability,
              public baselines, and source-verified policy movement. It does not
              certify companies, legal compliance, internal conduct, safety, or
              provider trustworthiness.
            </p>
            <div className={styles.heroActions}>
              <Link href="#evidence-board" className={styles.primaryAction}>
                Inspect evidence board
              </Link>
              <a href="/api/leaderboard" className={styles.secondaryAction}>
                Open JSON API
              </a>
            </div>
          </div>

          <div className={styles.signalPanel} aria-label="Leaderboard methodology summary">
            <div className={styles.signalHeader}>
              <span>Operational index</span>
              <strong>0-99</strong>
            </div>
            <div className={styles.signalTrack}>
              <span />
              <span />
              <span />
              <span />
            </div>
            <p>
              The index is capped below absolute certainty by design. Suspended
              sources reduce the index and are shown separately for review.
            </p>
          </div>
        </div>
      </section>

      {dbUnavailable && (
        <section className={styles.notice}>
          Evidence signals are temporarily unavailable because the database could
          not be reached. The board is intentionally empty until source evidence
          can be read.
        </section>
      )}

      <section className={styles.metricsStrip} aria-label="Current leaderboard summary">
        <MetricTile
          label="Companies"
          value={snapshot.summary.companyCount}
          detail="loaded from the monitored inventory"
        />
        <MetricTile
          label="Policies"
          value={snapshot.summary.policyCount}
          detail="configured public-source records"
        />
        <MetricTile
          label="Verified policies"
          value={snapshot.summary.verifiedPolicyCount}
          detail="non-seeded public baselines"
        />
        <MetricTile
          label="Suspended sources"
          value={snapshot.summary.suspendedPolicyCount}
          detail="excluded from public analysis"
        />
        <MetricTile
          label="Public changes"
          value={snapshot.summary.publicChangeCount}
          detail="publicEvidence-gated movement"
        />
      </section>

      <section className={styles.methodBand}>
        <div>
          <span className={styles.eyebrow}>Method boundary</span>
          <h2>{snapshot.methodology.title}</h2>
          <p>{snapshot.methodology.description}</p>
        </div>
        <ul>
          {snapshot.methodology.boundaries.map((boundary) => (
            <li key={boundary}>{boundary}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} id="evidence-board">
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>Board one</span>
          <h2>Source Evidence Index</h2>
          <p>
            Ordered by public baseline coverage, source traceability, freshness,
            and suspension pressure.
          </p>
        </div>
        {topEvidence.length > 0 && (
          <div className={styles.podiumGrid}>
            {topEvidence.map((row) => (
              <PodiumCard key={row.companyId} row={row} />
            ))}
          </div>
        )}
        <LeaderboardTable rows={snapshot.boards.evidence} />
      </section>

      <section className={`${styles.section} ${styles.splitSection}`}>
        <div>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrow}>Board two</span>
            <h2>Public Policy Movement</h2>
            <p>
              Counts only change records that passed the publicEvidence gate.
            </p>
          </div>
          <MovementBoard rows={snapshot.boards.movement} />
        </div>
        <div>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrow}>Board three</span>
            <h2>Source Attention Queue</h2>
            <p>
              Shows sources withheld from public interpretation until review.
            </p>
          </div>
          <AttentionBoard rows={snapshot.boards.attention} />
        </div>
      </section>

      <section className={styles.formulaSection}>
        <span className={styles.eyebrow}>How it is computed</span>
        <h2>Signals, not claims.</h2>
        <div className={styles.formulaGrid}>
          {snapshot.methodology.indexFormula.map((item, index) => (
            <article key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
