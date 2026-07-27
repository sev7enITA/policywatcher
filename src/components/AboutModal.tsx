'use client';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AboutModal.module.css';
import { X, Mail, Link, ShieldCheck, FileSearch, GitBranch, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
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
              <div className={styles.avatar}>
                <Image
                  src="/fabrizio-degni.png"
                  alt="Fabrizio Degni"
                  width={80}
                  height={80}
                  className={styles.avatarImg}
                  unoptimized
                />
              </div>
              <h2>Fabrizio Degni</h2>
              <p className={styles.subtitle}>Creator of PolicyWatcher</p>
            </div>

            <div className={styles.body}>
              <p>
                PolicyWatcher is a civic-tech project that presents changes in configured corporate AI, privacy, and governance-policy sources. Its repository is public under CC BY 4.0.
              </p>
              <p>
                The platform monitors configured public source URLs, detects version changes, maps risk indicators, and keeps Dataset QA status visible alongside the analysis.
              </p>
              <p>
                Sources that do not meet the public-evidence gate are temporarily suspended from public policy analysis until they can be reviewed.
              </p>
              <div className={styles.links}>
                <a href="/about" className={styles.link}>
                  <ArrowUpRight size={18} />
                  Open the full project page
                </a>
                <a href="/trust" className={styles.link}>
                  <ShieldCheck size={18} />
                  Trust & Quality Evidence
                </a>
                <a href="/methodology/confidence" className={styles.link}>
                  <FileSearch size={18} />
                  Confidence Methodology
                </a>
                <a href="/roadmap" className={styles.link}>
                  <GitBranch size={18} />
                  Community Roadmap
                </a>
              </div>
              <p>PolicyWatcher maps public policy texts and the evidence available for their retrieval. It does not assess internal company conduct.</p>
            </div>

            <div className={styles.contact}>
              <h3>Get in Touch</h3>
              <p>Have questions, feature requests, or spotted an inaccuracy? Feel free to reach out:</p>
              
              <div className={styles.links}>
                <a href="mailto:info@fabriziodegni.com" className={styles.link}>
                  <Mail size={18} />
                  info@fabriziodegni.com
                </a>
                <a href="https://linkedin.com/in/fabriziodegni" target="_blank" rel="noopener noreferrer" className={styles.link}>
                  <Link size={18} />
                  LinkedIn Profile
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
