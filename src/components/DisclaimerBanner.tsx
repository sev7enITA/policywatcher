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
          <strong>Beta Release:</strong> This platform is in active development (beta) and is not a final product. All information is generated through automated AI analysis and may contain inaccuracies or interpretive errors. It does not constitute legal advice or compliance certification. The author disclaims all liability. Interpretation and use of this data are solely at the user&apos;s own risk. Always verify with official sources.
          {' '}<a href="/privacy" style={{ color: '#6366f1', fontWeight: 500, textDecoration: 'underline' }}>Privacy Policy</a>
        </p>
      </div>
      <button onClick={() => setIsVisible(false)} className={styles.closeBtn} aria-label="Close disclaimer">
        <X size={18} />
      </button>
    </div>
  );
}
