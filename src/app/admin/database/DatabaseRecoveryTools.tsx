'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileCheck,
  Lock,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import styles from '../admin.module.css';

interface DecryptedBackupSummary {
  version: string;
  exportedAt: string | null;
  formatVersion: number;
  scope: 'complete-application-export' | 'legacy-partial-export';
  summary: { tableCount?: number; totalRecords?: number; counts?: Record<string, number> };
}

export function DatabaseRecoveryTools({ role }: { role: 'admin' | 'auditor' }) {
  const [exportPassword, setExportPassword] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [decryptFile, setDecryptFile] = useState<File | null>(null);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptLoading, setDecryptLoading] = useState(false);
  const [decryptError, setDecryptError] = useState('');
  const [decryptedSummary, setDecryptedSummary] = useState<DecryptedBackupSummary | null>(null);

  async function handleExportBackup() {
    if (exportPassword.length < 12) {
      setExportError('Password must be at least 12 characters long.');
      return;
    }

    setExportLoading(true);
    setExportError('');
    setExportSuccess(false);

    try {
      const response = await fetch('/api/admin/export-encrypted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: exportPassword }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || 'Export failed.');
      }

      const url = window.URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `policywatcher-backup-encrypted-${new Date().toISOString().slice(0, 10)}.enc`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setExportPassword('');
      setExportSuccess(true);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setExportLoading(false);
    }
  }

  async function handleVerifyBackup() {
    if (!decryptFile) {
      setDecryptError('Select an encrypted backup file first.');
      return;
    }
    if (!decryptPassword) {
      setDecryptError('Enter the password used to encrypt the backup.');
      return;
    }

    setDecryptLoading(true);
    setDecryptError('');
    setDecryptedSummary(null);

    try {
      const response = await fetch('/api/admin/decrypt-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedString: await decryptFile.text(), password: decryptPassword }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Verification failed.');
      setDecryptedSummary(payload);
      setDecryptPassword('');
    } catch (error) {
      setDecryptError(error instanceof Error ? error.message : 'Verification failed.');
    } finally {
      setDecryptLoading(false);
    }
  }

  if (role === 'auditor') {
    return (
      <section id="database-recovery" className={styles.recoveryPanel} aria-labelledby="database-recovery-title">
        <header className={styles.recoveryHeader}>
          <div>
            <span>Admin-owned operation</span>
            <h2 id="database-recovery-title"><Lock size={19} /> Database recovery</h2>
          </div>
        </header>
        <p className={styles.recoveryReadOnly}>
          <ShieldCheck size={17} /> Auditor access is read-only. Database readiness, integrity, schema and migration evidence remain available elsewhere on this page. Encrypted export and local file verification are administrator-only; this surface does not measure whether a backup exists, when one was created or whether recovery has been tested.
        </p>
      </section>
    );
  }

  return (
    <section id="database-recovery" className={styles.recoveryPanel} aria-labelledby="database-recovery-title">
      <header className={styles.recoveryHeader}>
        <div>
          <span>Admin operation</span>
          <h2 id="database-recovery-title"><Lock size={19} /> Database recovery</h2>
          <p>Create an encrypted export or verify a PolicyWatcher backup locally without importing data.</p>
        </div>
      </header>

      <div className={styles.backupPanel}>
        <form className={styles.backupCol} onSubmit={(event) => { event.preventDefault(); void handleExportBackup(); }}>
          <h3 className={styles.backupColTitle}><Download size={18} /> Encrypted export</h3>
          <p className={styles.backupDescription}>Exports all 31 application tables in a versioned AES-256-GCM envelope. Keep the password outside the downloaded file. A verified export is not a restore rehearsal.</p>
          {exportError && <p className={`${styles.alert} ${styles.alertWarning}`} role="alert"><AlertTriangle size={14} />{exportError}</p>}
          {exportSuccess && <p className={styles.recoverySuccess} role="status"><ShieldCheck size={14} />Encrypted backup downloaded.</p>}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="recovery-export-password">Encryption password</label>
            <input id="recovery-export-password" type="password" className={styles.input} autoComplete="new-password" minLength={12} value={exportPassword} onChange={(event) => setExportPassword(event.target.value)} disabled={exportLoading} />
          </div>
          <button type="submit" disabled={exportLoading} className={`${styles.btn} ${styles.btnPrimary}`}>
            <Lock size={16} />{exportLoading ? 'Encrypting…' : 'Export encrypted data'}
          </button>
        </form>

        <form className={styles.backupCol} onSubmit={(event) => { event.preventDefault(); void handleVerifyBackup(); }}>
          <h3 className={styles.backupColTitle}><Unlock size={18} /> Local verification</h3>
          <p className={styles.backupDescription}>Decrypts only the selected file and returns its bounded summary. It does not restore or write records.</p>
          {decryptError && <p className={`${styles.alert} ${styles.alertWarning}`} role="alert"><AlertTriangle size={14} />{decryptError}</p>}
          <label className={styles.fileInputWrapper} htmlFor="recovery-backup-file">
            <input
              id="recovery-backup-file"
              type="file"
              accept=".enc"
              onChange={(event) => {
                setDecryptFile(event.target.files?.[0] || null);
                setDecryptedSummary(null);
                setDecryptError('');
              }}
              className={styles.visuallyHiddenInput}
            />
            <FileCheck size={26} aria-hidden="true" />
            <span className={styles.fileInputText}>{decryptFile ? decryptFile.name : 'Select backup file (.enc)'}</span>
            <span className={styles.fileInputSubtext}>{decryptFile ? `${(decryptFile.size / 1024).toFixed(1)} KB` : 'Choose a local encrypted file'}</span>
          </label>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="recovery-decrypt-password">Backup password</label>
            <input id="recovery-decrypt-password" type="password" className={styles.input} autoComplete="current-password" value={decryptPassword} onChange={(event) => setDecryptPassword(event.target.value)} disabled={decryptLoading} />
          </div>
          <button type="submit" disabled={decryptLoading || !decryptFile} className={`${styles.btn} ${styles.btnPrimary}`}>
            <Unlock size={16} />{decryptLoading ? 'Verifying…' : 'Decrypt and verify'}
          </button>

          {decryptedSummary && (
            <div className={styles.decryptedResult} role="status">
              <h4 className={styles.decryptedTitle}><ShieldCheck size={16} /> Backup verified</h4>
              <dl className={styles.decryptedStats}>
                <div className={styles.decryptedStatItem}><dt>Version</dt><dd className={styles.decryptedValue}>{decryptedSummary.version}</dd></div>
                <div className={styles.decryptedStatItem}><dt>Format</dt><dd className={styles.decryptedValue}>v{decryptedSummary.formatVersion} · {decryptedSummary.scope}</dd></div>
                <div className={styles.decryptedStatItem}><dt>Exported</dt><dd className={styles.decryptedValue}>{decryptedSummary.exportedAt ? new Date(decryptedSummary.exportedAt).toLocaleDateString() : 'Unknown'}</dd></div>
                <div className={styles.decryptedStatItem}><dt>Tables</dt><dd className={styles.decryptedValue}>{decryptedSummary.summary.tableCount ?? 'Legacy partial'}</dd></div>
                <div className={styles.decryptedStatItem}><dt>Records</dt><dd className={styles.decryptedValue}>{decryptedSummary.summary.totalRecords ?? 'Not declared'}</dd></div>
              </dl>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
