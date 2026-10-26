/** URL locale hints are source-variant evidence, not a legal-jurisdiction classifier. */
const REGION_HINTS = new Set('us gb uk it de fr es pt nl be ie at ch dk se no fi pl cz gr ro hu bg hr si sk ee lv lt cy mt lu au nz ca br mx ar cl co pe jp kr cn tw hk sg in id my ph th vn za ae sa il tr ua eu eea'.split(' '));

function regionHint(url: URL): string | undefined {
  const leading = url.pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  if (!leading) return undefined;
  const locale = /^[a-z]{2,3}-([a-z]{2})$/.exec(leading);
  const region = locale?.[1] || leading;
  return REGION_HINTS.has(region) ? region === 'uk' ? 'gb' : region : undefined;
}

export function hasExplicitLocaleDrift(requestedUrl: string, finalUrl: string): boolean {
  try {
    const requested = new URL(requestedUrl); const final = new URL(finalUrl);
    if (requested.hostname.replace(/^www\./, '') !== final.hostname.replace(/^www\./, '')) return false;
    const before = regionHint(requested); const after = regionHint(final);
    if (before && after && before !== after) return true;
    // Only explicit language selectors are compared. Missing hints stay unknown.
    for (const parameter of ['hl', 'lang', 'locale']) {
      const original = requested.searchParams.get(parameter)?.toLowerCase().replaceAll('_', '-');
      const redirected = final.searchParams.get(parameter)?.toLowerCase().replaceAll('_', '-');
      if (original && redirected && original !== redirected) return true;
    }
    return false;
  } catch { return false; }
}
