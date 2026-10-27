'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import styles from './PublicCompanyFinder.module.css';

/** Receives only company identities that passed the public publication gate. */
export default function PublicCompanyFinder({ companies, unavailable = false }: {
  companies: Array<{ id: string; name: string; slug: string }>;
  unavailable?: boolean;
}) {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const term = query.trim().toLocaleLowerCase();
  const matches = companies.filter((company) => `${company.name} ${company.slug}`.toLocaleLowerCase().includes(term));
  return (
    <section className={styles.finder} aria-label="Find a company policy">
      <label htmlFor={inputId}>Find your company</label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Company name, e.g. Google"
        autoComplete="off"
        disabled={unavailable}
      />
      {unavailable ? (
        <p role="status">
          Company search is temporarily unavailable. <Link href="/knowledge">Open public records</Link>.
        </p>
      ) : companies.length === 0 ? (
        <p role="status">
          No verified company records are available yet. <Link href="/guides">Read the verification guides</Link>.
        </p>
      ) : (
        <>
          {term && (
            <p role="status">
              {matches.length
                ? `${matches.length} matching ${matches.length === 1 ? 'company' : 'companies'}`
                : 'No published company record matches this name.'}
            </p>
          )}
          <ul>
            {matches.slice(0, term ? 6 : 3).map((company) => (
              <li key={company.id}>
                <Link href={`/knowledge/companies/${company.slug}`}>{company.name}</Link>
              </li>
            ))}
          </ul>
          <Link className={styles.allRecords} href="/knowledge#companies">Browse all company records</Link>
          {term && !matches.length && (
            <p>
              <Link href="/what-changed">Check your notice</Link> or <Link href="/guides">follow the verification guides</Link>.
              {' '}No match here does not mean the provider has no policy.
            </p>
          )}
        </>
      )}
    </section>
  );
}
