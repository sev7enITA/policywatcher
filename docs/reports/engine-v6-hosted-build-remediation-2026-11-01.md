# Engine 6 hosted build remediation, 1 November 2026

The first hosted Preview deployment failed before database migrations. Hostinger retained the previous staging build. Its Next.js preset renamed the original configuration and inserted an exact 191-byte wrapper to force standalone output. All other 79 implementation entries and the renamed original configuration matched the uploaded artifact. This was a real integrity rejection, not a successful online release.

Candidate 3 declares standalone output in the canonical source and recognizes only that observed wrapper. The normalizer checks the base against the immutable manifest, rejects unknown bytes and linked files, then restores the approved bytes atomically before preflight. It never regenerates the implementation manifest during a build. A future provider transformation will fail closed and require another reviewed change.

Executed verification: **1,565 automated tests passed, 14 skipped**; optimized Next build completed; **22 checks passed** against the actual generated standalone server with a fresh isolated database. HTTP and worker identity matched, missing opt-in retained privacy while disabling execution, no jobs were created and official records remained unchanged. The original harness assertion that no `src` directory could exist was too broad: Next legitimately traced nine adaptive-acquisition auxiliary files. That failed attempt is retained; the successful test kept the generated payload unchanged and verified absence of the engine implementation sources.

GLM-5.3 Max reviewed the frozen compatibility patch in Plan mode, without executing tests. It found no concrete integrity bypass or runtime mismatch and retained the managed-host deployment requirement. The earlier 44-check live comparison/recovery evidence belongs to candidate 2 and has not been relabelled as a new execution of candidate 3.

Three CodeQL filesystem races in local diagnostic/bootstrap tools were repaired using descriptor-bound reads and exclusive initialization. Seven medium-severity data-flow findings have a separate [documented triage](engine-v6-codeql-triage-2026-11-01.md); no claim of a passing remote security gate is made at this checkpoint. Acquisition code and the frozen daily cohort were not changed.

The second hosted deployment is pending at this checkpoint. Exact local artifact hashes and the failed remote deployment identity are retained in the [receipt](engine-v6-hosted-build-remediation-2026-11-01.json). Public production remains 5.2.0; publication and notifications in the Preview remain disabled.
