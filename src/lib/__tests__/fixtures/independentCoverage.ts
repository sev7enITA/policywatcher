import { coverageInventoryDigest, type ReviewedCoverageInventory } from '../../engine/coverage';
/** Authored fixture references only; never called with a fetched candidate. */
export function reviewedFixture(body: Omit<ReviewedCoverageInventory, 'inventorySha256'>): ReviewedCoverageInventory {
  const reference = { ...body, schemaVersion: 2 as const,
    independence: { captureId: 'reference-fixture-capture', reviewId: 'fixture-review-01',
      procedure: 'Separately authored synthetic reference reviewed before candidate acquisition.', independentOfCandidate: true as const },
    elements: body.units.map((unit, index) => ({ ...unit, section: [...unit.section], id: `element-${index}`,
      elementKind: unit.kind === 'heading' ? 'section' as const : unit.kind === 'table' ? 'table_row' as const : 'clause' as const })), attachments: body.attachments || [], links: body.links || [] };
  return { ...reference, inventorySha256: coverageInventoryDigest(reference) };
}
