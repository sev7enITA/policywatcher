# PolicyWatcher 3.8.3 Beta 4 - Hostinger deployment

This is a source deployment package. It intentionally excludes `.next`,
`node_modules`, environment files and SQLite databases.

## Required Hostinger configuration

1. Extract the ZIP into the Node.js application directory.
2. Use Node.js 22.
3. Configure `DATABASE_URL` as an absolute writable path outside the extracted
   release directory, for example:

   `file:/home/USER/domains/policywatcher.online/policywatcher-data/production.db`

4. Install with `npm ci` and build with `npm run build`.
5. Set the startup file to `server.js` or use the startup command `npm start`.
6. Do not configure `next start` directly: it bypasses the database readiness
   gate packaged with the release.
7. Restart the Node.js application after replacing the previous release.

The startup log must show the configured database path, `Database schema is
ready` and a `policyInquiries` count before Next.js starts accepting traffic.

## Manual recovery if the startup command was previously wrong

From the extracted application directory, with the same environment variables
used by the Node.js application, run:

```bash
bash scripts/hostinger-init-db.sh
```

Then set the Hostinger startup file to `server.js` and restart the application.

## Acceptance check

Paste a controlled, non-personal notice ending in `Il Team MioDottore` and
containing `contatto@miodottore.it` at `/what-changed`. The local summary must
show `MioDottore`, the sender domain `miodottore.it`, and Privacy, Cookie and IA.
Submission must return an `inq_` reference, create a row in
`/admin/inquiries`, increment the open-inquiry counter and, when SMTP is
configured, send the privacy-minimized administrator alert.
