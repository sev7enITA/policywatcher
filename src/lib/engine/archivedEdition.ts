/**
 * Detect an explicit contradiction between the recorded edition and the archived
 * introduction. Regional subsections and single mentions do not identify an edition.
 */
export function archivedEditionConflict(edition: string, text: string) {
  if (edition.trim().toLowerCase() !== 'global') return null;
  const intro = text.slice(0, 2200);
  const heading = /^#[ \t]+([^\n]+?)[ \t]*$/m.exec(intro);
  if (!heading || !/^(?:Europe|European|EEA) (?:Terms of Use|Terms of Service|Privacy Policy)$/i.test(heading[1])) return null;
  const following = intro.slice(heading.index + heading[0].length).split(/^#{1,6}[ \t]/m, 1)[0];
  const applicability = /\b(?:These (?:Terms(?: of (?:Use|Service))?) apply|This (?:Privacy )?Policy applies) (?:only )?if you (?:reside|live) in ([^.!?\n]{2,180})[.!?]/i.exec(following);
  if (!applicability) return null;
  // Require an exhaustive list of recognised European territories. Open lists,
  // additional countries and wording whose scope is unclear require manual review.
  const territories = applicability[1].replace(/\s*\((?:EEA|EU|UK)\)/gi, '')
    .split(/\s*(?:,|\bor\b|\band\b)\s*/i)
    .map(part => part.trim().replace(/^the\s+/i, ''))
    .filter(Boolean);
  const european = /^(?:European Economic Area|EEA|European Union|EU|Switzerland|UK|United Kingdom)$/i;
  if (!territories.length || !territories.every(name => european.test(name))) return null;
  return { heading: heading[1], applicability: applicability[0] };
}
