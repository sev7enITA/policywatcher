'use client';

import React from 'react';
import { ShieldAlert, Mail, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function SecurityPage() {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={logoContainerStyle}>
            <ShieldAlert size={28} style={{ color: '#6366f1' }} />
            <span style={logoTextStyle}>PolicyWatcher Security</span>
          </div>
          <h1 style={titleStyle}>Vulnerability Disclosure Policy</h1>
          <p style={subtitleStyle}>
            We take security seriously. If you discover a security vulnerability in our platform, please report it to us responsibly.
          </p>
        </div>

        <div style={contentStyle}>
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>How to Report</h2>
            <p style={paragraphStyle}>
              Please send vulnerability reports via email to <a href="mailto:security@policywatcher.online" style={linkStyle}>security@policywatcher.online</a>. To help us triage your report quickly, please include:
            </p>
            <ul style={listStyle}>
              <li>A description of the vulnerability and its potential impact.</li>
              <li>Detailed, step-by-step instructions or a proof-of-concept (PoC) to reproduce it.</li>
              <li>Any suggested remediation steps.</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Responsible Disclosure Guidelines</h2>
            <p style={paragraphStyle}>
              We request that you follow these guidelines to protect our users and system:
            </p>
            <ul style={listStyle}>
              <li>Give us reasonable time to investigate and mitigate the issue before making it public.</li>
              <li>Do not access, modify, or delete user data that does not belong to you.</li>
              <li>Do not perform destructive actions, distributed denial of service (DDoS), or social engineering attacks.</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Our Commitment</h2>
            <p style={paragraphStyle}>
              If you follow the guidelines above, we commit to:
            </p>
            <ul style={listStyle}>
              <li>Acknowledge receipt of your report in a timely manner.</li>
              <li>Work quickly to resolve the vulnerability.</li>
              <li>Not pursue legal action against you.</li>
            </ul>
          </section>
        </div>

        <div style={footerStyle}>
          <a href="mailto:security@policywatcher.online?subject=Vulnerability%20Report" style={buttonStyle}>
            <Send size={16} /> Report a Vulnerability
          </a>
          <Link href="/" style={backLinkStyle}>
            <ArrowLeft size={16} /> Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '40px 24px',
  background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.05), transparent 60%), #f8fafc',
  fontFamily: 'var(--font-sans)',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '680px',
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
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '24px',
};

const logoContainerStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
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
  fontSize: '1.65rem',
  fontWeight: 700,
  color: '#0f172a',
  marginBottom: '12px',
  letterSpacing: '-0.02em',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  lineHeight: '1.6',
  color: '#64748b',
  margin: 0,
};

const contentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '28px',
  marginBottom: '36px',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  fontWeight: 700,
  color: '#1e293b',
  margin: 0,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  lineHeight: '1.6',
  color: '#475569',
  margin: 0,
};

const linkStyle: React.CSSProperties = {
  color: '#6366f1',
  textDecoration: 'underline',
  fontWeight: 500,
};

const listStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  lineHeight: '1.6',
  color: '#475569',
  margin: 0,
  paddingLeft: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  borderTop: '1px solid #f1f5f9',
  paddingTop: '24px',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 28px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
  color: '#ffffff',
  fontSize: '0.92rem',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const backLinkStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 600,
  color: '#64748b',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'color 0.2s ease',
};
