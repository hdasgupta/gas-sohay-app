import React, { useEffect } from 'react';

export default function MessagwBox({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 0 
}) {
  if (!message) return null;

  // Auto-dismiss after duration (in milliseconds) if set
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Alert type themes
  const themes = {
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: 'ℹ️' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', icon: '✅' },
    warning: { bg: '#fffbeb', border: '#fef08a', text: '#b45309', icon: '⚠️' },
    error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', icon: '❌' }
  };

  const style = themes[type] || themes.info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        padding: '12px 16px',
        marginBottom: '12px',
        borderRadius: '6px',
        border: `1px solid ${style.border}`,
        backgroundColor: style.bg,
        color: style.text,
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{style.icon}</span>
        <span>{message}</span>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: style.text,
            fontSize: '16px',
            cursor: 'pointer',
            padding: '0 4px',
            lineHeight: 1
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
