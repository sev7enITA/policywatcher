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

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Play,
  Database,
  BarChart3,
  Building2,
  BookOpen,
  LogOut,
  Shield,
} from 'lucide-react';
import styles from './admin.module.css';

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
    label: 'Companies',
    href: '/admin/companies',
    icon: <Building2 size={18} />,
    adminOnly: true,
  },
  {
    label: 'Explainability',
    href: '/admin/explainability',
    icon: <BookOpen size={18} />,
  },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const [role, setRole] = useState<Role | null>(null);
  const [verified, setVerified] = useState(false);

  // Verify session on mount
  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        const res = await fetch('/api/admin/metrics');
        if (res.status === 401) {
          router.replace('/admin/login');
          return;
        }
        if (!res.ok) {
          router.replace('/admin/login');
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setRole(data.role || 'auditor');
          setVerified(true);
        }
      } catch {
        if (!cancelled) {
          router.replace('/admin/login');
        }
      }
    }

    verifySession();
    return () => {
      cancelled = true;
    };
  }, [router]);

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
  if (!verified) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  // Filter nav items based on role
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || role === 'admin'
  );

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        {/* Header / Logo */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logoArea}>
            <div className={styles.logoIcon}>
              <Shield size={18} />
            </div>
            <div>
              <div className={styles.logoText}>PolicyWatcher</div>
              <div className={styles.logoTextSub}>Admin Panel</div>
            </div>
          </div>
          <span
            className={`${styles.roleBadge} ${
              role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeAuditor
            }`}
          >
            {role}
          </span>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${
                isActive(item.href) ? styles.navLinkActive : ''
              }`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
