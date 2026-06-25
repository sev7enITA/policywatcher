'use client';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AboutModal.module.css';
import { X, Mail, Link } from 'lucide-react';
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
                PolicyWatcher was created to bring transparency to the rapidly evolving landscape of corporate AI, privacy, and governance policies.
              </p>
              <p>
                As tech giants continuously update their terms, often affecting how our data is used for AI training, it's crucial to have a centralized way to track and analyze these changes.
              </p>
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
