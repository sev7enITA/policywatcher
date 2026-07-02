'use client';
import { useState } from 'react';
import styles from './DisclaimerBanner.module.css';
import { AlertCircle, X } from 'lucide-react';

export default function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <AlertCircle size={18} className={styles.icon} />
        <p>
          <strong>Confidence Release v3.5:</strong> This platform is in active development. Information is generated through automated AI-assisted text analysis and may contain inaccuracies or interpretive errors. It does not constitute legal advice, compliance certification, or a definitive assessment of corporate conduct. The author disclaims all liability. Interpretation and use of this data is solely at the user&apos;s own risk. Always verify with provider sources.
          {' '}<a href="/privacy" style={{ color: '#6366f1', fontWeight: 500, textDecoration: 'underline' }}>Privacy Policy</a>
        </p>
      </div>
      <button onClick={() => setIsVisible(false)} className={styles.closeBtn} aria-label="Close disclaimer">
        <X size={18} />
      </button>
    </div>
  );
}
