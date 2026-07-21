'use client';

/**
 * Admin Layout
 *
 * @file src/app/admin/layout.tsx
 *
 * Wraps all /admin/* pages with a fixed sidebar and main content area.
 * On mount, verifies the session by calling GET /api/admin/metrics.
 * If the session is invalid (401), redirects to /admin/login.
 * Role-based visibility hides admin-only links for auditor users.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Play,
  Database,
  BarChart3,
  Building2,
  BookOpen,
  ClipboardCheck,
  History,
  LogOut,
  Server,
  AlertTriangle,
  ShieldCheck,
  Menu,
  X,
  ListPlus,
} from 'lucide-react';
import styles from './admin.module.css';
import { AdminPageGuide } from '@/components/admin/AdminPageGuide';
import { getAdminGuide } from '@/lib/adminGuides';
import { POLICYWATCHER_VERSION } from '@/lib/release';

type Role = 'admin' | 'auditor';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Cron Manager',
    href: '/admin/cron',
    icon: <Play size={18} />,
    adminOnly: true,
  },
  {
    label: 'VPS Services',
    href: '/admin/vps-services',
    icon: <Server size={18} />,
  },
  {
    label: 'Database',
    href: '/admin/database',
    icon: <Database size={18} />,
  },
  {
    label: 'KPI Audit',
    href: '/admin/kpi-audit',
    icon: <BarChart3 size={18} />,
  },
  {
    label: 'Dataset QA',
    href: '/admin/dataset-quality',
    icon: <ClipboardCheck size={18} />,
  },
  {
    label: 'Review Log',
    href: '/admin/review-log',
    icon: <History size={18} />,
  },
  {
    label: 'Access Log',
    href: '/admin/access-logs',
    icon: <ShieldCheck size={18} />,
    adminOnly: true,
  },
  {
    label: 'Companies',
    href: '/admin/companies',
    icon: <Building2 size={18} />,
    adminOnly: true,
  },
  {
    label: 'Source Onboarding',
    href: '/admin/source-onboarding',
    icon: <ListPlus size={18} />,
    adminOnly: true,
  },
  {
    label: 'Explainability',
    href: '/admin/explainability',
    icon: <BookOpen size={18} />,
  },
];

function AdminNavigationContents({
  role,
  visibleItems,
  isActive,
  onNavigate,
  onLogout,
  mobile = false,
  closeRef,
}: {
  role: Role | null;
  visibleItems: NavItem[];
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  onLogout: () => void;
  mobile?: boolean;
  closeRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoArea}>
          <Image
            src="/logo-mark.png"
            alt="PolicyWatcher Logo"
            width={30}
            height={30}
            priority
            style={{ objectFit: 'contain' }}
          />
          <div>
            <div className={styles.logoText}>PolicyWatcher</div>
            <div className={styles.logoTextSub}>
              Admin Panel <span className={styles.logoVersion}>v{POLICYWATCHER_VERSION}</span>
            </div>
          </div>
        </div>
        <span className={`${styles.roleBadge} ${role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeAuditor}`}>
          {role}
        </span>
        {mobile && (
          <button ref={closeRef} type="button" className={styles.mobileNavClose} onClick={onNavigate} aria-label="Close admin navigation">
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      <nav className={styles.nav} aria-label="Admin navigation">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}
            onClick={onNavigate}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <button type="button" className={styles.logoutButton} onClick={() => { onNavigate?.(); onLogout(); }}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const [role, setRole] = useState<Role | null>(null);
  const [verified, setVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileDrawerRef = useRef<HTMLElement | null>(null);
  const mobileCloseRef = useRef<HTMLButtonElement | null>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Verify session on mount
  useEffect(() => {
    if (pathname === '/admin/login') {
      return;
    }
    let cancelled = false;

    async function verifySession() {
      try {
        const res = await fetch('/api/admin/metrics');
        if (res.status === 401) {
          router.replace('/admin/login');
          return;
        }
        if (!res.ok) {
          const payload = await res.json().catch(() => null) as {
            error?: string;
            database?: {
              path?: string | null;
              directoryPath?: string | null;
              directoryExists?: boolean;
              directoryWritable?: boolean;
              fileExists?: boolean;
              fileSizeBytes?: number;
              configured?: boolean;
            };
          } | null;
          if (!cancelled) {
            const database = payload?.database;
            const databaseDetail = database
              ? ` Path: ${database.path || 'n/a'}; directory: ${database.directoryPath || 'n/a'}; directory exists: ${String(database.directoryExists)}; writable: ${String(database.directoryWritable)}; file exists: ${String(database.fileExists)}; size: ${String(database.fileSizeBytes)} bytes; DATABASE_URL configured: ${String(database.configured)}.`
              : '';
            setVerificationError(`${payload?.error || `Admin session check failed (HTTP ${res.status}).`}${databaseDetail}`);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setRole(data.role || 'auditor');
          setVerified(true);
        }
      } catch {
        if (!cancelled) {
          setVerificationError('Unable to verify the admin session. Check runtime logs and deployment environment variables.');
        }
      }
    }

    verifySession();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  useEffect(() => {
    queueMicrotask(() => setMobileNavOpen(false));
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    const triggerElement = mobileTriggerRef.current;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => mobileCloseRef.current?.focus(), 0);

    function handleDrawerKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileNavOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !mobileDrawerRef.current) return;
      const focusable = Array.from(mobileDrawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleDrawerKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleDrawerKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerElement?.focus();
    };
  }, [mobileNavOpen]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } finally {
      router.replace('/admin/login');
    }
  }, [router]);

  /**
   * Determine whether a nav link is active.
   * Exact match for /admin (dashboard); prefix match for all others.
   */
  function isActive(href: string): boolean {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  }

  // Show a loading spinner until session is verified
  if (pathname !== '/admin/login' && verificationError) {
    return (
      <div className={styles.loadingScreen}>
        <AlertTriangle size={32} color="var(--risk-high)" />
        <p className={styles.loadingText}>{verificationError}</p>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={() => router.replace('/admin/login')}
        >
          Back to login
        </button>
      </div>
    );
  }

  // Show a loading spinner until session is verified
  if (pathname !== '/admin/login' && !verified) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  // If we are on the login page, render children directly without layout wrapper
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Filter nav items based on role
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || role === 'admin'
  );

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <AdminNavigationContents role={role} visibleItems={visibleItems} isActive={isActive} onLogout={handleLogout} />
      </aside>

      <header className={styles.mobileAdminHeader}>
        <div className={styles.mobileAdminBrand}>
          <Image src="/logo-mark.png" alt="" width={28} height={28} aria-hidden="true" />
          <div><strong>PolicyWatcher</strong><span>{getAdminGuide(pathname)?.title || 'Admin'}</span></div>
        </div>
        <button
          ref={mobileTriggerRef}
          type="button"
          className={styles.mobileNavTrigger}
          onClick={() => setMobileNavOpen(true)}
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-admin-navigation"
          aria-label="Open admin navigation"
        >
          <Menu size={21} aria-hidden="true" />
          Menu
        </button>
      </header>

      {mobileNavOpen && (
        <div className={styles.mobileNavBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileNavOpen(false); }}>
          <aside
            id="mobile-admin-navigation"
            ref={mobileDrawerRef}
            className={styles.mobileNavDrawer}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
          >
            <AdminNavigationContents
              role={role}
              visibleItems={visibleItems}
              isActive={isActive}
              onNavigate={() => setMobileNavOpen(false)}
              onLogout={handleLogout}
              mobile
              closeRef={mobileCloseRef}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={styles.mainContent}>
        <AdminPageGuide key={pathname} pathname={pathname} />
        {children}
      </main>
    </div>
  );
}
