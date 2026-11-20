'use client';

import { useState } from 'react';
import styles from './briefing.module.css';

export default function ShareComparison({ path, lang, review }: { path: string; lang: 'it' | 'en'; review?: string }) {
  const it = lang === 'it';
  const [include, setInclude] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState('');
  async function copy() {
    const url = new URL(path, window.location.origin).href;
    const message = include && review ? url + '\n' + review : url;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setManual('');
    } catch {
      setCopied(false);
      setManual(message);
    }
  }
  return <details className={styles.shareBox}>
    <summary>{it ? 'Condividi il confronto' : 'Share comparison'}</summary>
    <p>{it ? 'Il link apre queste due versioni pubbliche.' : 'The link opens these two public versions.'}</p>
    <a href={path}>{it ? 'Apri il link condivisibile' : 'Open shareable link'}</a>
    {review && <label><input type="checkbox" checked={include} onChange={e => { setInclude(e.target.checked); setCopied(false); setManual(''); }}/>
      {it ? 'Aggiungi la mia annotazione al testo da copiare' : 'Add my review note to the copied text'}</label>}
    {include && review && <p>{review}</p>}
    <button type="button" onClick={copy}>{include ? (it ? 'Copia link e annotazione' : 'Copy link and note') : (it ? 'Copia link' : 'Copy link')}</button>
    <span role="status">{copied ? (it ? 'Copiato' : 'Copied') : ''}</span>
    {manual && <label>{it ? 'Seleziona e copia' : 'Select and copy'}<textarea readOnly value={manual} onFocus={e => e.target.select()} /></label>}
  </details>;
}
