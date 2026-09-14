import React, { useEffect } from 'react';

const TYPE_CONFIG = {
  info: {
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    textColor: '#1e40af',
    barColor: '#3b82f6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  warning: {
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    textColor: '#92400e',
    barColor: '#f59e0b',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  error: {
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    textColor: '#991b1b',
    barColor: '#ef4444',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  success: {
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    textColor: '#065f46',
    barColor: '#10b981',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
};

const MessageBox = ({ message, type = 'info', duration = 3000, onClose }) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  // Auto-close timer
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div style={{ ...styles.container, backgroundColor: config.bgColor, borderColor: config.borderColor, color: config.textColor }}>
      <div style={styles.content}>
        <span style={styles.iconContainer}>{config.icon}</span>
        <span style={styles.message}>{message}</span>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
          &#x2715;
        </button>
      </div>

      {/* Reverse Progress Bar */}
      {duration > 0 && (
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressBar,
              backgroundColor: config.barColor,
              animationDuration: `${duration}ms`,
            }}
          />
        </div>
      )}

      {/* Embedded Animation CSS */}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    minWidth: '300px',
    maxWidth: '450px',
    padding: '12px 16px 16px 16px',
    borderRadius: '8px',
    borderStyle: 'solid',
    borderWidth: '1px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    fontFamily: 'sans-serif',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  message: {
    flexGrow: 1,
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.4',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    opacity: '0.6',
    color: 'inherit',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '4px',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    animationName: 'shrinkWidth',
    animationTimingFunction: 'linear',
    animationFillMode: 'forwards',
  },
};

export default MessageBox;
