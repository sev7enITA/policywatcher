'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';
  
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!tokenParam) {
      setStatus('error');
      setMessage('A secure unsubscribe token is required. Please unsubscribe using the link at the bottom of a PolicyWatcher email.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: tokenParam }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Successfully unsubscribed.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to unsubscribe. Please verify the URL or email.');
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={logoContainerStyle}>
            <span style={logoTextStyle}>PolicyWatcher</span>
          </div>
          <h1 style={titleStyle}>Cancel Email Subscription</h1>
          <p style={subtitleStyle}>
            We're sorry to see you go. Confirm your email below to stop receiving policy alerts and updates.
          </p>
        </div>

        {status === 'success' ? (
          <div style={successContainerStyle}>
            <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
            <h2 style={successTitleStyle}>You have unsubscribed</h2>
            <p style={successMessageStyle}>{message}</p>
            <Link href="/" style={linkButtonStyle}>
              Go to Homepage <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={inputGroupStyle}>
              <label htmlFor="email" style={labelStyle}>
                Email Address
              </label>
              <div style={inputWrapperStyle}>
                <Mail size={18} style={mailIconStyle} />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  style={inputStyle}
                />
              </div>
            </div>

            {status === 'error' && (
              <div style={errorContainerStyle}>
                <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !email}
              style={buttonStyle}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={16} style={spinnerStyle} />
                  Processing...
                </>
              ) : (
                'Unsubscribe'
              )}
            </button>

            <Link href="/" style={cancelLinkStyle}>
              Cancel and Return
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 size={32} style={spinnerStyle} />
          </div>
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '24px',
  background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.05), transparent 60%), #f8fafc',
  fontFamily: 'var(--font-sans)',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '24px',
  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
  padding: '40px',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '32px',
};

const logoContainerStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
};

const logoTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.25rem',
  fontWeight: 800,
  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#0f172a',
  marginBottom: '10px',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  lineHeight: '1.6',
  color: '#64748b',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 600,
  color: '#334155',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const mailIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '16px',
  color: '#94a3b8',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px 12px 48px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  fontSize: '0.95rem',
  color: '#0f172a',
  background: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  padding: '14px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
  color: '#ffffff',
  fontSize: '0.92rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
};

const cancelLinkStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 500,
  color: '#64748b',
  textDecoration: 'none',
  textAlign: 'center',
};

const successContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: '16px 0',
};

const successTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#0f172a',
  marginBottom: '8px',
};

const successMessageStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  lineHeight: '1.6',
  color: '#64748b',
  marginBottom: '24px',
};

const linkButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 24px',
  borderRadius: '12px',
  background: 'rgba(99, 102, 241, 0.08)',
  color: '#6366f1',
  fontWeight: 600,
  fontSize: '0.9rem',
  textDecoration: 'none',
};

const errorContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 16px',
  borderRadius: '10px',
  background: '#fee2e2',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  color: '#991b1b',
  fontSize: '0.85rem',
  lineHeight: '1.4',
};

const spinnerStyle: React.CSSProperties = {
  animation: 'spin 1s linear infinite',
};
