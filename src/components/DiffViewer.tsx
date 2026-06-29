/**
 * DiffViewer — reusable, XSS-safe renderer for policy text changes.
 *
 * Handles BOTH diff formats stored in PolicyChange.diff:
 *   1. JSON array of chunks  { value, added?, removed? }  (written by /api/scrape)
 *   2. Unified-diff STRING   (written by /api/cron/check-all via createPatch)
 *
 * SECURITY: all content is rendered via React text interpolation ({value}).
 * NEVER use dangerouslySetInnerHTML here — diff content originates from
 * scraped upstream policy text and must be treated as untrusted.
 *
 * Stateless: safe to render in a Server Component.
 */
import { FileDiff } from 'lucide-react';
import styles from './DiffViewer.module.css';
import { parseDiff, type JsonChunk } from '@/lib/diffParse';
import type { Lang } from '@/types';

interface DiffViewerProps {
  diff: string;
  lang: Lang;
  /** Optional max-height for the scroll container (CSS value). Default: 400px. */
  maxHeight?: string;
  /** Optional title above the diff box. */
  title?: string;
}

function renderChunks(chunks: JsonChunk[]) {
  return chunks.map((chunk, index) => {
    let lineClass = styles.diffUnchanged;
    let prefix = '  ';
    if (chunk.added) {
      lineClass = styles.diffAdded;
      prefix = '+ ';
    } else if (chunk.removed) {
      lineClass = styles.diffRemoved;
      prefix = '- ';
    }
    return (
      <span key={index} className={`${styles.diffLine} ${lineClass}`}>
        {prefix}
        {chunk.value}
      </span>
    );
  });
}

export default function DiffViewer({
  diff,
  lang,
  maxHeight = '400px',
  title,
}: DiffViewerProps) {
  const isIt = lang === 'it';

  // Empty state
  if (!diff || diff.trim().length === 0) {
    return (
      <div className={styles.wrapper}>
        {title && <h3 className={styles.title}>{title}</h3>}
        <div className={styles.empty}>
          <FileDiff size={20} />
          <span>
            {isIt
              ? 'Nessuna differenza testuale disponibile per questo cambio.'
              : 'No text diff available for this change.'}
          </span>
        </div>
      </div>
    );
  }

  // Detect format and normalize to chunks
  const chunks = parseDiff(diff);

  return (
    <div className={styles.wrapper}>
      {title && (
        <h3 className={styles.title}>
          <FileDiff size={16} />
          {title}
        </h3>
      )}
      <div className={styles.diffContainer} style={{ maxHeight }}>
        {renderChunks(chunks)}
      </div>
    </div>
  );
}
