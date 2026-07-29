'use client';

import Link from 'next/link';
import { Check, FolderPlus } from 'lucide-react';
import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import styles from './AddToCollectionButton.module.css';

export const EVIDENCE_COLLECTION_STORAGE_KEY = 'policywatcher:evidence-collection:v1';
export const EVIDENCE_COLLECTION_EVENT = 'policywatcher:evidence-collection-change';
export const EVIDENCE_COLLECTION_LIMIT = 12;

export type CollectionReviewState = 'unreviewed' | 'reviewing' | 'reviewed';

export interface LocalEvidenceCollection {
  version: 1;
  title: string;
  selectedIds: string[];
  reviewStates: Record<string, CollectionReviewState>;
}

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REVIEW_STATES = new Set<CollectionReviewState>(['unreviewed', 'reviewing', 'reviewed']);

export function emptyLocalEvidenceCollection(): LocalEvidenceCollection {
  return { version: 1, title: '', selectedIds: [], reviewStates: {} };
}

export function parseLocalEvidenceCollection(value: string | null): LocalEvidenceCollection | null {
  if (!value || value.length > 8000) return null;

  try {
    const candidate = JSON.parse(value) as Partial<LocalEvidenceCollection>;
    if (candidate.version !== 1 || !Array.isArray(candidate.selectedIds)) return null;

    const selectedIds = [...new Set(candidate.selectedIds
      .filter((id): id is string => typeof id === 'string' && UUID_V4_RE.test(id))
      .map((id) => id.toLowerCase()))].slice(0, EVIDENCE_COLLECTION_LIMIT);
    const allowedIds = new Set(selectedIds);
    const reviewStates: Record<string, CollectionReviewState> = {};

    if (candidate.reviewStates && typeof candidate.reviewStates === 'object') {
      for (const [id, state] of Object.entries(candidate.reviewStates)) {
        if (allowedIds.has(id) && REVIEW_STATES.has(state as CollectionReviewState)) {
          reviewStates[id] = state as CollectionReviewState;
        }
      }
    }

    return {
      version: 1,
      title: typeof candidate.title === 'string' ? candidate.title.slice(0, 80) : '',
      selectedIds,
      reviewStates,
    };
  } catch {
    return null;
  }
}

interface AddToCollectionButtonProps {
  changeId: string;
  className?: string;
  compact?: boolean;
}

export default function AddToCollectionButton({
  changeId,
  className,
  compact = false,
}: AddToCollectionButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [message, setMessage] = useState('');
  const normalizedId = changeId.toLowerCase();

  const syncState = useCallback(() => {
    try {
      const collection = parseLocalEvidenceCollection(localStorage.getItem(EVIDENCE_COLLECTION_STORAGE_KEY));
      setIsAdded(Boolean(collection?.selectedIds.includes(normalizedId)));
    } catch {
      setIsAdded(false);
    }
  }, [normalizedId]);

  useEffect(() => {
    const timer = window.setTimeout(syncState, 0);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === EVIDENCE_COLLECTION_STORAGE_KEY) syncState();
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener(EVIDENCE_COLLECTION_EVENT, syncState);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EVIDENCE_COLLECTION_EVENT, syncState);
    };
  }, [syncState]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    try {
      const stored = parseLocalEvidenceCollection(localStorage.getItem(EVIDENCE_COLLECTION_STORAGE_KEY));
      const collection = stored ?? emptyLocalEvidenceCollection();

      if (collection.selectedIds.includes(normalizedId)) {
        event.preventDefault();
        setMessage('This change is already in your local collection.');
        return;
      }

      if (collection.selectedIds.length >= EVIDENCE_COLLECTION_LIMIT) {
        event.preventDefault();
        setMessage(`Collection limit reached: ${EVIDENCE_COLLECTION_LIMIT} public changes.`);
        return;
      }

      const next: LocalEvidenceCollection = {
        ...collection,
        selectedIds: [...collection.selectedIds, normalizedId],
        reviewStates: { ...collection.reviewStates, [normalizedId]: 'unreviewed' },
      };
      localStorage.setItem(EVIDENCE_COLLECTION_STORAGE_KEY, JSON.stringify(next));
      event.preventDefault();
      setIsAdded(true);
      setMessage('Added to your browser-local evidence collection.');
      window.dispatchEvent(new Event(EVIDENCE_COLLECTION_EVENT));
    } catch {
      // Keep the anchor navigation: /collections?changes=<id> is the storage-free fallback.
    }
  }

  return (
    <span className={`${styles.wrap} ${compact ? styles.compact : ''} ${className ?? ''}`}>
      <Link
        href={`/collections?changes=${encodeURIComponent(normalizedId)}`}
        className={styles.button}
        onClick={handleClick}
        aria-label={isAdded ? 'Change already in local collection' : 'Add this change to a local evidence collection'}
      >
        {isAdded ? <Check size={16} aria-hidden="true" /> : <FolderPlus size={16} aria-hidden="true" />}
        {isAdded ? 'In collection' : 'Add to collection'}
      </Link>
      <span className={styles.live} role="status" aria-live="polite">{message}</span>
    </span>
  );
}
