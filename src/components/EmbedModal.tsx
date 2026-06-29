'use client';

/**
 * EmbedModal — shows the embeddable iframe snippet for a change permalink.
 * Renders as a button that opens a modal with copy-to-clipboard functionality.
 */
import { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';

interface EmbedModalProps {
  changeId: string;
  companyName: string;
}

export default function EmbedModal({ changeId, companyName }: EmbedModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://policywatcher.online';

  const snippet = `<iframe\n  src="${baseUrl}/embed/change/${changeId}"\n  width="100%"\n  height="300"\n  frameborder="0"\n  style="border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px;"\n  title="PolicyWatcher — ${companyName} policy change"\n></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = snippet;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '11px 18px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          fontWeight: 600,
          textDecoration: 'none',
          cursor: 'pointer',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-body)',
          transition: 'all 0.2s ease',
          fontFamily: 'var(--font-display)',
        }}
      >
        <Share2 size={15} />
        Embed
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 22px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#0f172a',
                }}
              >
                <Share2 size={16} color="#6366f1" />
                Embed this change
              </h3>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 22px' }}>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: '#64748b',
                  margin: '0 0 14px 0',
                  lineHeight: 1.5,
                }}
              >
                Copy this snippet and paste it into your article, blog post, or
                website to embed this policy change analysis.
              </p>

              <div
                style={{
                  background: '#0f172a',
                  borderRadius: '10px',
                  padding: '16px',
                  position: 'relative',
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontSize: '0.72rem',
                    lineHeight: 1.6,
                    color: '#94a3b8',
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {snippet}
                </pre>
                <button
                  onClick={handleCopy}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: copied ? '#10b981' : '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'background 0.2s ease',
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={12} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy
                    </>
                  )}
                </button>
              </div>

              {/* Preview label */}
              <p
                style={{
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  margin: '14px 0 8px 0',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Preview
              </p>

              {/* Live preview iframe */}
              <div
                style={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  height: '300px',
                }}
              >
                <iframe
                  src={`/embed/change/${changeId}`}
                  width="100%"
                  height="300"
                  style={{ border: 'none', display: 'block' }}
                  title="Embed preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
