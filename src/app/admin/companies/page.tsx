'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import styles from '../admin.module.css';

/* ---------- Types ---------- */
interface Policy {
  id: string;
  name: string;
  type: string;
  url: string;
  jurisdiction: string;
  currentHash: string | null;
  updatedAt: string;
  _count: { changes: number; snapshots: number };
}

interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string;
  website: string;
  logo: string | null;
  createdAt: string;
  policies: Policy[];
  _count: { policies: number };
}

type Role = 'admin' | 'auditor';

const INDUSTRIES = [
  'Tech Giant',
  'FinTech',
  'Social Media',
  'E-Commerce',
  'AI Provider',
  'Cloud/SaaS',
] as const;

const POLICY_TYPES = [
  { value: 'privacy', label: 'Privacy' },
  { value: 'terms', label: 'Terms' },
  { value: 'ai', label: 'AI' },
  { value: 'aup', label: 'AUP' },
  { value: 'developer', label: 'Developer' },
] as const;

const JURISDICTIONS = ['EU', 'US', 'Global', 'UK'] as const;

const INDUSTRY_COLORS: Record<string, string> = {
  'Tech Giant': 'badgePrimary',
  'FinTech': 'badgeWarning',
  'Social Media': 'badgeSecondary',
  'E-Commerce': 'badgeSuccess',
  'AI Provider': 'badgeDanger',
  'Cloud/SaaS': 'badgePrimary',
};

/* ---------- Component ---------- */
export default function CompanyManagerPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Company form
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    slug: '',
    industry: INDUSTRIES[0] as string,
    website: '',
    logo: '',
  });
  const [addCompanyLoading, setAddCompanyLoading] = useState(false);
  const [addCompanyError, setAddCompanyError] = useState('');

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Add Policy form (per company)
  const [addPolicyFor, setAddPolicyFor] = useState<string | null>(null);
  const [policyForm, setPolicyForm] = useState({
    name: '',
    type: 'privacy' as string,
    url: '',
    jurisdiction: 'Global' as string,
  });
  const [addPolicyLoading, setAddPolicyLoading] = useState(false);
  const [addPolicyError, setAddPolicyError] = useState('');

  // Delete Company modal
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ---------- Data Fetching ---------- */
  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/companies', {
        credentials: 'include',
      });

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setCompanies(data.companies || []);
      setRole(data.role || null);
    } catch {
      setError('Failed to load companies. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  /* ---------- Slug Auto-generation ---------- */
  const handleCompanyNameChange = (value: string) => {
    setCompanyForm((prev) => ({
      ...prev,
      name: value,
      slug: value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    }));
  };

  /* ---------- Add Company ---------- */
  const handleAddCompany = async () => {
    if (!companyForm.name.trim() || !companyForm.slug.trim() || !companyForm.website.trim()) {
      setAddCompanyError('Name, slug, and website are required.');
      return;
    }

    setAddCompanyError('');
    setAddCompanyLoading(true);

    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyForm.name.trim(),
          slug: companyForm.slug.trim(),
          industry: companyForm.industry,
          website: companyForm.website.trim(),
          logo: companyForm.logo.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setAddCompanyError(data.error || 'Failed to create company.');
        return;
      }

      // Reset form and refresh
      setCompanyForm({ name: '', slug: '', industry: INDUSTRIES[0], website: '', logo: '' });
      setShowAddCompany(false);
      await fetchCompanies();
    } catch {
      setAddCompanyError('Network error. Please try again.');
    } finally {
      setAddCompanyLoading(false);
    }
  };

  /* ---------- Delete Company ---------- */
  const handleDeleteCompany = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/companies?id=${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to delete company.');
        return;
      }

      setDeleteTarget(null);
      setDeleteConfirmName('');
      await fetchCompanies();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ---------- Add Policy ---------- */
  const handleAddPolicy = async (companyId: string) => {
    if (!policyForm.name.trim() || !policyForm.url.trim()) {
      setAddPolicyError('Name and URL are required.');
      return;
    }

    setAddPolicyError('');
    setAddPolicyLoading(true);

    try {
      const res = await fetch('/api/admin/policies', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          name: policyForm.name.trim(),
          type: policyForm.type,
          url: policyForm.url.trim(),
          jurisdiction: policyForm.jurisdiction,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setAddPolicyError(data.error || 'Failed to create policy.');
        return;
      }

      setPolicyForm({ name: '', type: 'privacy', url: '', jurisdiction: 'Global' });
      setAddPolicyFor(null);
      await fetchCompanies();
    } catch {
      setAddPolicyError('Network error. Please try again.');
    } finally {
      setAddPolicyLoading(false);
    }
  };

  /* ---------- Delete Policy ---------- */
  const handleDeletePolicy = async (policyId: string, policyName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the policy "${policyName}"? This will remove all associated snapshots and change records.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/policies?id=${policyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to delete policy.');
        return;
      }

      await fetchCompanies();
    } catch {
      setError('Network error. Please try again.');
    }
  };

  /* ---------- Toggle Expand ---------- */
  const toggleRow = (companyId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      return next;
    });
  };

  const isAdmin = role === 'admin';

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  /* ---------- Render ---------- */
  return (
    <>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <Building2 size={28} />
          Company Manager
        </h1>
        <p className={styles.pageSubtitle}>
          Add, remove, and manage monitored companies
        </p>
        {isAdmin && (
          <div className={styles.pageActions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => {
                setShowAddCompany(!showAddCompany);
                setAddCompanyError('');
              }}
            >
              <Plus size={16} />
              {showAddCompany ? 'Cancel' : 'Add Company'}
            </button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className={`${styles.alert} ${styles.alertDanger}`}>
          <AlertTriangle size={16} />
          {error}
          <button
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 600 }}
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add Company Form */}
      {showAddCompany && isAdmin && (
        <div className={styles.formInline}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-main)' }}>
            New Company
          </h3>

          {addCompanyError && (
            <div className={`${styles.alert} ${styles.alertDanger}`}>
              <AlertTriangle size={14} />
              {addCompanyError}
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="company-name">Name</label>
              <input
                id="company-name"
                className={styles.input}
                type="text"
                value={companyForm.name}
                onChange={(e) => handleCompanyNameChange(e.target.value)}
                placeholder="e.g. OpenAI"
                disabled={addCompanyLoading}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="company-slug">Slug</label>
              <input
                id="company-slug"
                className={styles.input}
                type="text"
                value={companyForm.slug}
                onChange={(e) =>
                  setCompanyForm((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="auto-generated"
                disabled={addCompanyLoading}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="company-industry">Industry</label>
              <select
                id="company-industry"
                className={styles.select}
                value={companyForm.industry}
                onChange={(e) =>
                  setCompanyForm((prev) => ({ ...prev, industry: e.target.value }))
                }
                disabled={addCompanyLoading}
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="company-website">Website</label>
              <input
                id="company-website"
                className={styles.input}
                type="url"
                value={companyForm.website}
                onChange={(e) =>
                  setCompanyForm((prev) => ({ ...prev, website: e.target.value }))
                }
                placeholder="https://example.com"
                disabled={addCompanyLoading}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="company-logo">
              Logo Color (hex, optional)
            </label>
            <input
              id="company-logo"
              className={styles.input}
              type="text"
              value={companyForm.logo}
              onChange={(e) =>
                setCompanyForm((prev) => ({ ...prev, logo: e.target.value }))
              }
              placeholder="#6366f1"
              disabled={addCompanyLoading}
            />
          </div>

          <div className={styles.formActions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleAddCompany}
              disabled={addCompanyLoading}
            >
              <Plus size={16} />
              {addCompanyLoading ? 'Creating...' : 'Create Company'}
            </button>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => {
                setShowAddCompany(false);
                setAddCompanyError('');
              }}
              disabled={addCompanyLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Companies Table */}
      {companies.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <Building2 size={48} />
            <p>No companies found. Add your first company to get started.</p>
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Name</th>
                <th>Slug</th>
                <th>Industry</th>
                <th>Website</th>
                <th>Policies</th>
                <th>Created</th>
                {isAdmin && <th style={{ width: 80 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => {
                const isExpanded = expandedRows.has(company.id);
                const logoColor = company.logo || '#6366f1';
                const initials = company.name
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <CompanyTableRow
                    key={company.id}
                    company={company}
                    isExpanded={isExpanded}
                    isAdmin={isAdmin}
                    logoColor={logoColor}
                    initials={initials}
                    onToggle={() => toggleRow(company.id)}
                    onDeleteCompany={() => setDeleteTarget(company)}
                    onDeletePolicy={handleDeletePolicy}
                    addPolicyFor={addPolicyFor}
                    setAddPolicyFor={setAddPolicyFor}
                    policyForm={policyForm}
                    setPolicyForm={setPolicyForm}
                    addPolicyLoading={addPolicyLoading}
                    addPolicyError={addPolicyError}
                    setAddPolicyError={setAddPolicyError}
                    onAddPolicy={() => handleAddPolicy(company.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Company Confirmation Modal */}
      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={() => { setDeleteTarget(null); setDeleteConfirmName(''); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              <AlertTriangle size={20} color="var(--risk-high)" />
              Delete Company
            </h2>
            <p className={styles.modalText}>
              This will permanently delete <strong>{deleteTarget.name}</strong> and
              all {deleteTarget._count.policies} associated{' '}
              {deleteTarget._count.policies === 1 ? 'policy' : 'policies'},
              including their snapshots and change history.
            </p>
            <p className={styles.modalText}>
              To confirm, type the company name below:
            </p>
            <div className={styles.formGroup}>
              <input
                className={styles.input}
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={deleteTarget.name}
                disabled={deleteLoading}
                autoFocus
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteConfirmName('');
                }}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={handleDeleteCompany}
                disabled={deleteConfirmName !== deleteTarget.name || deleteLoading}
              >
                <Trash2 size={14} />
                {deleteLoading ? 'Deleting...' : 'Delete Company'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Company Table Row Sub-component ---------- */
interface CompanyTableRowProps {
  company: Company;
  isExpanded: boolean;
  isAdmin: boolean;
  logoColor: string;
  initials: string;
  onToggle: () => void;
  onDeleteCompany: () => void;
  onDeletePolicy: (policyId: string, policyName: string) => void;
  addPolicyFor: string | null;
  setAddPolicyFor: (id: string | null) => void;
  policyForm: { name: string; type: string; url: string; jurisdiction: string };
  setPolicyForm: React.Dispatch<
    React.SetStateAction<{ name: string; type: string; url: string; jurisdiction: string }>
  >;
  addPolicyLoading: boolean;
  addPolicyError: string;
  setAddPolicyError: (err: string) => void;
  onAddPolicy: () => void;
}

function CompanyTableRow({
  company,
  isExpanded,
  isAdmin,
  logoColor,
  initials,
  onToggle,
  onDeleteCompany,
  onDeletePolicy,
  addPolicyFor,
  setAddPolicyFor,
  policyForm,
  setPolicyForm,
  addPolicyLoading,
  addPolicyError,
  setAddPolicyError,
  onAddPolicy,
}: CompanyTableRowProps) {
  const industryBadge = INDUSTRY_COLORS[company.industry] || 'badgePrimary';
  const showPolicyForm = addPolicyFor === company.id;

  return (
    <>
      {/* Main Row */}
      <tr className={styles.companyRow} onClick={onToggle}>
        <td>
          <span className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </td>
        <td>
          <span className={styles.companyName}>
            <span
              className={styles.companyLogo}
              style={{ background: logoColor }}
            >
              {initials}
            </span>
            {company.name}
          </span>
        </td>
        <td>
          <code className={styles.slug}>{company.slug}</code>
        </td>
        <td>
          <span className={`${styles.badge} ${styles[industryBadge]}`}>
            {company.industry}
          </span>
        </td>
        <td>
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: 'var(--primary)', fontSize: '0.82rem' }}
          >
            {company.website.replace(/^https?:\/\//, '')}
          </a>
        </td>
        <td>{company._count.policies}</td>
        <td>{new Date(company.createdAt).toLocaleDateString()}</td>
        {isAdmin && (
          <td>
            <div className={styles.rowActions}>
              <button
                className={`${styles.btn} ${styles.btnSmall} ${styles.btnDangerOutline}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCompany();
                }}
                title="Delete company"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </td>
        )}
      </tr>

      {/* Expanded Row */}
      {isExpanded && (
        <tr className={styles.expandedRow}>
          <td colSpan={isAdmin ? 8 : 7}>
            <div className={styles.expandedContent}>
              <h4>
                <FileText size={15} />
                Policies ({company.policies.length})
                {isAdmin && (
                  <button
                    className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
                    onClick={() => {
                      if (showPolicyForm) {
                        setAddPolicyFor(null);
                      } else {
                        setPolicyForm({ name: '', type: 'privacy', url: '', jurisdiction: 'Global' });
                        setAddPolicyError('');
                        setAddPolicyFor(company.id);
                      }
                    }}
                    style={{ marginLeft: 'auto' }}
                  >
                    <Plus size={13} />
                    {showPolicyForm ? 'Cancel' : 'Add Policy'}
                  </button>
                )}
              </h4>

              {/* Add Policy Inline Form */}
              {showPolicyForm && isAdmin && (
                <div className={styles.formInline} style={{ marginBottom: 16 }}>
                  {addPolicyError && (
                    <div className={`${styles.alert} ${styles.alertDanger}`}>
                      <AlertTriangle size={14} />
                      {addPolicyError}
                    </div>
                  )}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Policy Name</label>
                      <input
                        className={styles.input}
                        type="text"
                        value={policyForm.name}
                        onChange={(e) =>
                          setPolicyForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="e.g. Privacy Policy"
                        disabled={addPolicyLoading}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Type</label>
                      <select
                        className={styles.select}
                        value={policyForm.type}
                        onChange={(e) =>
                          setPolicyForm((prev) => ({ ...prev, type: e.target.value }))
                        }
                        disabled={addPolicyLoading}
                      >
                        {POLICY_TYPES.map((pt) => (
                          <option key={pt.value} value={pt.value}>
                            {pt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>URL</label>
                      <input
                        className={styles.input}
                        type="text"
                        value={policyForm.url}
                        onChange={(e) =>
                          setPolicyForm((prev) => ({ ...prev, url: e.target.value }))
                        }
                        placeholder="https://example.com/privacy"
                        disabled={addPolicyLoading}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Jurisdiction</label>
                      <select
                        className={styles.select}
                        value={policyForm.jurisdiction}
                        onChange={(e) =>
                          setPolicyForm((prev) => ({ ...prev, jurisdiction: e.target.value }))
                        }
                        disabled={addPolicyLoading}
                      >
                        {JURISDICTIONS.map((j) => (
                          <option key={j} value={j}>
                            {j}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button
                      className={`${styles.btn} ${styles.btnSmall} ${styles.btnPrimary}`}
                      onClick={onAddPolicy}
                      disabled={addPolicyLoading}
                    >
                      <Plus size={14} />
                      {addPolicyLoading ? 'Adding...' : 'Add Policy'}
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
                      onClick={() => setAddPolicyFor(null)}
                      disabled={addPolicyLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Policies List */}
              {company.policies.length === 0 ? (
                <p className={styles.noPolicies}>
                  No policies tracked for this company yet.
                </p>
              ) : (
                <ul className={styles.policyList}>
                  {company.policies.map((policy) => (
                    <li key={policy.id} className={styles.policyItem}>
                      <div className={styles.policyInfo}>
                        <FileText size={14} style={{ flexShrink: 0, color: 'var(--text-dark)' }} />
                        <span className={styles.policyName}>{policy.name}</span>
                        <span className={`${styles.badge} ${styles.badgeSecondary}`}>
                          {policy.type}
                        </span>
                        <span className={`${styles.badge} ${styles.badgePrimary}`}>
                          {policy.jurisdiction}
                        </span>
                        <span className={styles.policyUrl} title={policy.url}>
                          {policy.url}
                        </span>
                      </div>
                      <div className={styles.policyMeta}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                          {policy._count.changes} changes / {policy._count.snapshots} snapshots
                        </span>
                        {isAdmin && (
                          <button
                            className={`${styles.btn} ${styles.btnSmall} ${styles.btnDangerOutline}`}
                            onClick={() => onDeletePolicy(policy.id, policy.name)}
                            title="Delete policy"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
