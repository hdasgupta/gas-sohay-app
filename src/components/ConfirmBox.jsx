import React from 'react';

export default function ConfirmBox({ 
  isOpen, 
  title = "Confirm Action", 
  message, 
  onConfirm 
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#ffffff',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={() => onConfirm(false)}
            style={{
              padding: '8px 16px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#334155',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(true)}
            style={{
              padding: '8px 16px',
              background: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
