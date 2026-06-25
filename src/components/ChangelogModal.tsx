'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Calendar, Clock, Sparkles } from 'lucide-react';
import styles from './ChangelogModal.module.css';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>

            <div className={styles.header}>
              <div className={styles.iconContainer}>
                <Sparkles size={24} className={styles.sparkleIcon} />
              </div>
              <h2>System Changelog</h2>
              <p className={styles.subtitle}>Feature implementation status & roadmap</p>
            </div>

            <div className={styles.body}>
              {/* Implemented Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <CheckCircle2 size={16} className={styles.sectionIconActive} />
                  Implemented Features
                </h3>
                <div className={styles.featureList}>
                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>AI Engine Migration & Open Source (v2.4.0)</span>
                      <span className={styles.badgeActive}>New</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Migrated AI engine from deprecated Gemini 1.5 Flash to Gemini 2.5 Flash with automatic fallback to Gemini 2.0 Flash-Lite on 503/429 errors for high-availability resilience. Published full source code on GitHub under CC BY 4.0 license with comprehensive documentation, architecture diagrams, and methodology. Replaced all emoji with custom SVG icon set across the onboarding wizard.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Interactive Onboarding & How To Guide (v2.3.0)</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Interactive user onboarding wizard displaying platform features, limits, disclaimers, and AI live assistant routing. Includes a custom opt-out skip checkbox, session-scoped pop management, and a permanent "How To" header button.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Email Alerts, Digests & Personalization (v2.2.0)</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Personalized real-time alerts or weekly/monthly digests filtered by chosen regions and industry preferences, complete with self-service unsubscribe management.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>AI Live Assistant & Natural TTS</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Conversational chatbot trained on corporate policies using Google Cloud Text-to-Speech API for natural voice interactions.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Global Command Palette</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Global overlay search (CMD+K / Ctrl+K) allowing quick search, filter, and immediate actions on monitored companies and policies.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Side-by-Side Compare (A/B)</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Detailed diffing interface displaying additions, deletions, and structural policy revisions with Gemini AI risk analysis.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>KPI Compliance Matrix</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Visual matrix showing how companies perform across standard privacy, AI governance, and ethical indicators.
                    </p>
                  </div>
                </div>
              </div>

              {/* Roadmap Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Clock size={16} className={styles.sectionIconRoadmap} />
                  Product Roadmap (Next Releases)
                </h3>
                <div className={styles.featureList}>
                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>GDPR & EU AI Act Alignment Engine</span>
                      <span className={styles.badgeRoadmap}>Q3 2026</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Detailed auditing tool matching policy changes to specific legal requirements and compliance checkpoints.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Custom Subscriptions & Alerts</span>
                      <span className={styles.badgeRoadmap}>Q3 2026</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Granular alert controls allowing users to opt into updates for individual companies directly from their profile.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>CSV & JSON Data Export</span>
                      <span className={styles.badgeRoadmap}>Q4 2026</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Download comparative data grids and compliance assessment logs for offline reporting and corporate auditing.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Native Dark Mode Support</span>
                      <span className={styles.badgeRoadmap}>Q4 2026</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Full CSS variables toggle to support a native, system-wide dark UI theme.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
