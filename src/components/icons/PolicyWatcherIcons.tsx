'use client';

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shield with scan lines - represents monitoring and scanning
 */
export function IconShieldScan({ size = 24, color = '#6366f1', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z" />
      <line x1="7" y1="10" x2="17" y2="10" strokeOpacity={0.5} />
      <line x1="7" y1="13" x2="17" y2="13" strokeOpacity={0.5} />
      <line x1="7" y1="16" x2="14" y2="16" strokeOpacity={0.5} />
    </svg>
  );
}

/**
 * Document with diff markers - represents policy change diffs
 */
export function IconDocumentDiff({ size = 24, color = '#6366f1', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="11" y2="13" stroke="#10b981" strokeWidth={2} />
      <line x1="13" y1="13" x2="15" y2="13" stroke="#10b981" strokeWidth={2} />
      <line x1="9" y1="17" x2="11" y2="17" stroke="#f43f5e" strokeWidth={2} />
      <line x1="13" y1="17" x2="15" y2="17" stroke="#f43f5e" strokeWidth={2} />
    </svg>
  );
}

/**
 * Gauge/meter - represents risk visualization
 */
export function IconRiskGauge({ size = 24, color = '#6366f1', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 6v2" />
      <path d="M18 12h-2" />
      <path d="M6 12h2" />
      <path d="M15.5 8.5l-1.4 1.4" />
      <path d="M9.9 9.9L8.5 8.5" />
      <line x1="12" y1="12" x2="15" y2="9" strokeWidth={2} stroke="#06b6d4" />
      <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
    </svg>
  );
}

/**
 * Globe with region markers - represents multi-region analysis
 */
export function IconRegionGlobe({ size = 24, color = '#06b6d4', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="4" ry="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M4.5 7h15" strokeOpacity={0.5} />
      <path d="M4.5 17h15" strokeOpacity={0.5} />
    </svg>
  );
}

/**
 * Brain with circuit patterns - represents AI governance
 */
export function IconAiGovernance({ size = 24, color = '#6366f1', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.2 6H8.2C6.3 13.7 5 11.5 5 9a7 7 0 017-7z" />
      <path d="M9 15v2a3 3 0 006 0v-2" />
      <circle cx="10" cy="9" r="1" fill={color} stroke="none" />
      <circle cx="14" cy="9" r="1" fill={color} stroke="none" />
      <line x1="10" y1="9" x2="14" y2="9" strokeWidth={1.5} />
      <line x1="12" y1="8" x2="12" y2="11" strokeWidth={1.5} stroke="#06b6d4" />
    </svg>
  );
}

/**
 * Clock with nodes - represents version timeline
 */
export function IconTimeline({ size = 24, color = '#6366f1', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="6" y1="3" x2="6" y2="21" />
      <circle cx="6" cy="6" r="2.5" fill="none" />
      <circle cx="6" cy="14" r="2.5" fill="none" />
      <circle cx="6" cy="20" r="1" fill={color} stroke="none" />
      <line x1="8.5" y1="6" x2="14" y2="6" />
      <line x1="8.5" y1="14" x2="14" y2="14" />
      <rect x="14" y="3.5" width="7" height="5" rx="1.5" strokeWidth={1.5} />
      <rect x="14" y="11.5" width="7" height="5" rx="1.5" strokeWidth={1.5} stroke="#06b6d4" />
    </svg>
  );
}

/**
 * Bell with alert dot - represents notifications
 */
export function IconBellAlert({ size = 24, color = '#6366f1', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
      <circle cx="18" cy="4" r="3" fill="#f43f5e" stroke="#f43f5e" strokeWidth={0} />
    </svg>
  );
}

/**
 * Box with arrow - represents export actions
 */
export function IconExport({ size = 24, color = '#06b6d4', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/**
 * Mail with plus - represents subscription
 */
export function IconSubscribe({ size = 24, color = '#6366f1', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="22 4 12 13 2 4" />
      <line x1="18" y1="14" x2="18" y2="20" stroke="#06b6d4" strokeWidth={2} />
      <line x1="15" y1="17" x2="21" y2="17" stroke="#06b6d4" strokeWidth={2} />
    </svg>
  );
}

/**
 * Circle with "i" - represents about/info
 */
export function IconAbout({ size = 24, color = '#06b6d4', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <circle cx="12" cy="8" r="0.5" fill={color} stroke="none" />
    </svg>
  );
}
