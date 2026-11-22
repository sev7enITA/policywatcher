'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogIn, AlertTriangle } from 'lucide-react';
import { POLICYWATCHER_VERSION } from '@/lib/release';
import styles from '../admin.module.css';

// Keep the initial HTML inert until React has attached the controlled-input handlers.
const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export default function AdminLoginPage() {
  const router = useRouter();
  const ready = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!ready || loading) return;
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    setLoading(true);
    let timeout: number | undefined;

    try {
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 15_000);
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (data.success && data.role) {
        router.push('/admin');
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === 'AbortError'
          ? 'Login request timed out. Check Hostinger runtime logs and DATABASE_URL.'
          : 'Unable to reach the server. Please try again later.'
      );
    } finally {
      if (timeout) window.clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard} aria-busy={!ready || loading}>
        <div className={styles.loginLogoWrapper}>
          <Image
            src="/logo-mark.png"
            alt="PolicyWatcher Logo"
            width={52}
            height={52}
            priority
            style={{ objectFit: 'contain' }}
          />
        </div>
        <h1 className={styles.loginTitle}>
          PolicyWatcher Admin
          <span className={styles.loginVersion}>v{POLICYWATCHER_VERSION}</span>
        </h1>

        {!ready && <p id="login-readiness" role="status">Preparing sign-in controls. Please wait.</p>}
        <noscript>JavaScript is required to sign in. Enable it and reload this page.</noscript>

        {error && (
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className={styles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your username"
            autoComplete="username"
            aria-describedby={!ready ? 'login-readiness' : undefined}
            disabled={!ready || loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your password"
            autoComplete="current-password"
            aria-describedby={!ready ? 'login-readiness' : undefined}
            disabled={!ready || loading}
          />
        </div>

        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleSubmit}
          disabled={!ready || loading}
        >
          <LogIn size={16} />
          {!ready ? 'Preparing sign-in...' : loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}
