/** Raw request/response provenance belongs to private storage, never broad public DTOs. */
export function publicChangeFields<T extends object>(row: T) {
  const { analysisEvidenceJson: _privateEvidence, ...publicRow } = row as T & { analysisEvidenceJson?: unknown };
  void _privateEvidence;
  return publicRow;
}
