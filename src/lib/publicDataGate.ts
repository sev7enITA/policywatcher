const SEEDED_INGESTION_METHOD = 'Seeded';
const PUBLIC_POLICY_STATUSES = ['Available', 'Reviewed'] as const;
const SUSPENDED_POLICY_STATUSES = ['Configured', 'Partial', 'Needs Review', 'Unavailable'] as const;

type WhereObject = Record<string, unknown>;

export function allowSeededPublicData(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.ALLOW_SEEDED_PUBLIC_DATA === 'true';
}

export function publicPolicyWhere<T extends WhereObject>(base?: T): T {
  if (allowSeededPublicData()) return ({ ...(base || {}) } as T);

  return {
    ...(base || {}),
    ingestionMethod: { not: SEEDED_INGESTION_METHOD },
    dataStatus: { in: [...PUBLIC_POLICY_STATUSES] },
    snapshots: { some: { publicEvidence: true } },
  } as unknown as T;
}

export function publicChangeWhere<T extends WhereObject>(base?: T): T {
  if (allowSeededPublicData()) return ({ ...(base || {}) } as T);

  const baseObject = (base || {}) as WhereObject;
  const policy = (baseObject.policy || {}) as WhereObject;
  return {
    ...baseObject,
    publicEvidence: true,
    policy: {
      ...policy,
      ingestionMethod: { not: SEEDED_INGESTION_METHOD },
      dataStatus: { in: [...PUBLIC_POLICY_STATUSES] },
      snapshots: { some: { publicEvidence: true } },
    },
  } as unknown as T;
}

export function publicSnapshotWhere<T extends WhereObject>(base?: T): T {
  if (allowSeededPublicData()) return ({ ...(base || {}) } as T);

  return {
    ...(base || {}),
    publicEvidence: true,
  } as unknown as T;
}

export function isSeededIngestionMethod(value: unknown): boolean {
  return typeof value === 'string' && value.trim().toLowerCase() === SEEDED_INGESTION_METHOD.toLowerCase();
}

export function suspendedPolicyWhere<T extends WhereObject>(base?: T): T {
  if (allowSeededPublicData()) return ({ ...(base || {}) } as T);

  return {
    ...(base || {}),
    OR: [
      { ingestionMethod: SEEDED_INGESTION_METHOD },
      { dataStatus: { in: [...SUSPENDED_POLICY_STATUSES] } },
      { snapshots: { none: { publicEvidence: true } } },
    ],
  } as unknown as T;
}

export function publicSuspensionMessage(lang: 'en' | 'it' = 'en'): string {
  return lang === 'it'
    ? 'Sono state identificate anomalie nell\'ultimo fetching o aggiornamento. La sorgente resta temporaneamente sospesa: i dati non vengono esposti al pubblico finche una baseline verificata, un PDF ufficiale o una revisione amministrativa tracciata non confermano la fonte.'
    : 'Anomalies were identified during the latest fetching or update cycle. This source remains temporarily suspended: its data is not exposed publicly until a verified baseline, official PDF, or traced admin review confirms the source.';
}
