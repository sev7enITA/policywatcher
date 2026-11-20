'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import styles from './PublicCompanyFinder.module.css';

/** Receives only company identities that passed the public publication gate. */
export default function PublicCompanyFinder({ companies, unavailable = false, lang = 'en' }: {
  companies: Array<{ id: string; name: string; slug: string }>;
  unavailable?: boolean;
  lang?: 'it' | 'en';
}) {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const term = query.trim().toLocaleLowerCase();
  const matches = companies.filter((company) => `${company.name} ${company.slug}`.toLocaleLowerCase().includes(term));
  return (
    <section className={styles.finder} aria-label={lang === 'it' ? "Cerca i documenti di un’azienda" : "Find a company policy"}>
      <label htmlFor={inputId}>{lang === 'it' ? "Cerca un’azienda" : "Find your company"}</label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={lang === 'it' ? "Nome dell’azienda, ad esempio Google" : "Company name, e.g. Google"}
        autoComplete="off"
        disabled={unavailable}
      />
      {unavailable ? (
        <p role="status">
          {lang === 'it' ? "La ricerca delle aziende è temporaneamente indisponibile." : "Company search is temporarily unavailable."} <Link href="/knowledge">{lang === 'it' ? "Apri il catalogo" : "Open public records"}</Link>.
        </p>
      ) : companies.length === 0 ? (
        <p role="status">
          {lang === 'it' ? "Al momento non sono disponibili aziende con record verificati." : "No verified company records are available yet."} <Link href={lang === 'it' ? '/guides?lang=it' : '/guides'}>{lang === 'it' ? "Consulta le guide alla verifica" : "Read the verification guides"}</Link>.
        </p>
      ) : (
        <>
          {term && (
            <p role="status">
              {matches.length
                ? (lang === 'it' ? `${matches.length} ${matches.length === 1 ? 'azienda trovata' : 'aziende trovate'}` : `${matches.length} matching ${matches.length === 1 ? 'company' : 'companies'}`)
                : (lang === 'it' ? 'Nessuna azienda pubblicata corrisponde a questo nome.' : 'No published company record matches this name.')}
            </p>
          )}
          <ul>
            {matches.slice(0, term ? 6 : 3).map((company) => (
              <li key={company.id}>
                <Link href={`/knowledge/companies/${company.slug}`}>{company.name}</Link>
              </li>
            ))}
          </ul>
          <Link className={styles.allRecords} href="/knowledge#companies">{lang === 'it' ? "Tutte le aziende in catalogo" : "Browse all company records"}</Link>
          {term && !matches.length && (
            <p>
              <Link href="/what-changed">{lang === 'it' ? "Verifica il tuo avviso" : "Check your notice"}</Link> {lang === 'it' ? 'oppure' : 'or'} <Link href={lang === 'it' ? '/guides?lang=it' : '/guides'}>{lang === 'it' ? "segui le guide alla verifica" : "follow the verification guides"}</Link>.
              {' '}{lang === 'it' ? "Un risultato vuoto non esclude che il fornitore abbia pubblicato una policy." : "No match here does not mean the provider has no policy."}
            </p>
          )}
        </>
      )}
    </section>
  );
}
