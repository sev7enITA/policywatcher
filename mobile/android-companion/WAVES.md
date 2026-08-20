# Completed delivery waves

## Functional wave 1 - Pocket Monitor

Evidence: typed feed codec and HTTPS client in `src/domain/changeEvent.ts` and `src/services/api.ts`; pull-to-refresh, search, risk filtering, freshness, cached and labelled demo states in `app/(tabs)/index.tsx`; SQLite KV persistence behind `src/services/storage.ts`; public-company-only watchlist and in-app “new since refresh” count; detail route at `app/change/[id].tsx`.

## Functional wave 2 - Review & Web Handoff

Evidence: 12-item collection, three local review states and ID-only canonical URL in `src/domain/collection.ts`; share/open actions and safe deep-link import in `app/(tabs)/collection.tsx`; safe change deep links; bilingual Companion/settings surface. No auth, admin actions, background inbox, raw email, QR pairing, sockets or real-time claims were added.

## UI/UX wave 1 - Evidence-first pocket shell

Evidence: Android bottom tabs, compact identity/freshness masthead, redundant risk labels and color, 48dp controls, wrapping layouts, pull-to-refresh, skeleton, empty, cached, failure/demo states. The numbered vertical evidence rail joins Today, Watchlist, Collection and detail views.

## UI/UX wave 2 - Evidence desk and calm handoff

Evidence: detail reading order follows subject → publication metadata → screening → boundary → provenance/actions; safe-area action dock; Select/Review/Handoff ribbon; reduced-motion-aware haptics; dismissible first-run explainer that can be restored from Companion.

## Current limitations

- Foreground polling only; no remote push or background refresh.
- Watchlist, collection titles and review status are local to one device/browser profile.
- Deep-linked IDs absent from the current feed retain a safe local placeholder until opened on the canonical web collection.
- The app consumes public publication events, not source delivery receipts or exhaustive legal alerts.

## Next safe increment

Add device-tested Android accessibility checks (TalkBack, large font, reduced motion), then introduce consent-based push only from the evidence-publication gate. Durable cross-device state should wait for an explicit identity and privacy model.
