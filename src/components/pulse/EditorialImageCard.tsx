import type { ReactNode } from 'react';

interface EditorialImageCardProps {
  eyebrow: string;
  title: string;
  fact: string;
  asOf: string;
  boundary: string;
  footer: string;
  logoUrl: string;
  tall?: boolean;
  compact?: boolean;
  children?: ReactNode;
}

export default function EditorialImageCard({ eyebrow, title, fact, asOf, boundary, footer, logoUrl, tall = false, compact = false, children }: EditorialImageCardProps) {
  const titleSize = compact ? 48 : tall ? 62 : 56;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: compact ? 54 : tall ? 82 : 66, color: '#10213d', background: 'linear-gradient(145deg, #f8fbff 0%, #eef5ff 52%, #e9f8f5 100%)', fontFamily: 'sans-serif', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', position: 'absolute', right: -120, top: -160, width: tall ? 620 : 470, height: tall ? 620 : 470, borderRadius: 999, border: '74px solid rgba(64,81,181,.08)' }} />
      <div style={{ display: 'flex', position: 'absolute', left: -80, bottom: -120, width: 340, height: 340, borderRadius: 999, border: '50px solid rgba(14,116,112,.08)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} width={compact ? 48 : 58} height={compact ? 48 : 58} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: compact ? 24 : 30, letterSpacing: '-0.03em' }}>PolicyWatcher</strong>
            <span style={{ fontSize: compact ? 12 : 15, color: '#536783', letterSpacing: '.12em', textTransform: 'uppercase' }}>Public evidence laboratory</span>
          </div>
        </div>
        <span style={{ display: 'flex', fontSize: compact ? 14 : 17, color: '#38516f', fontFamily: 'monospace' }}>AS OF {asOf}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', position: 'relative', maxWidth: tall ? '88%' : '91%' }}>
        <span style={{ display: 'flex', color: '#0f766e', fontSize: compact ? 15 : 19, fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: compact ? 18 : 28 }}>{eyebrow}</span>
        <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.045em' }}>{title}</div>
        <div style={{ display: 'flex', marginTop: compact ? 22 : 34, paddingLeft: compact ? 20 : 28, borderLeft: '7px solid #4658ba', color: '#334966', fontSize: compact ? 22 : 27, lineHeight: 1.35 }}>{fact}</div>
        {children}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', paddingTop: 22, borderTop: '2px solid rgba(33,58,92,.14)' }}>
        <span style={{ display: 'flex', fontSize: compact ? 13 : 16, color: '#9a5a11' }}>BOUNDARY · {boundary}</span>
        <span style={{ display: 'flex', fontSize: compact ? 13 : 15, color: '#536783' }}>{footer}</span>
      </div>
    </div>
  );
}
