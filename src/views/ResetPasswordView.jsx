import React, { useState } from 'react';
import { callBackend } from '../utils/backend';

export default function ResetPasswordView({ onBackToLogin, styles = {} }) {
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP & Reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const cardStyle = styles.card || {
    padding: '32px',
    background: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    maxWidth: '420px',
    margin: '40px auto'
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your registered email.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    callBackend('sendPasswordResetOtp', [email], (res) => {
      setLoading(false);
      if (res && res.success) {
        setMessage({ type: 'success', text: res.message });
        setStep(2);
      } else {
        setMessage({ type: 'error', text: res?.error || 'Failed to send OTP.' });
      }
    });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      setMessage({ type: 'error', text: 'Please enter the OTP sent to your email.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and Confirm password do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    callBackend(
      'resetPasswordWithOtp',
      [email, otp, newPassword, confirmPassword],
      (res) => {
        setLoading(false);
        if (res && res.success) {
          setMessage({ type: 'success', text: res.message });
          setTimeout(() => {
            if (onBackToLogin) onBackToLogin();
          }, 2000);
        } else {
          setMessage({ type: 'error', text: res?.error || 'Failed to reset password.' });
        }
      }
    );
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '22px', textAlign: 'center' }}>
        Reset Password
      </h2>
      <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', textAlign: 'center' }}>
        {step === 1
          ? 'Enter your account email to receive a reset OTP code'
          : `Enter the OTP sent to ${email} and your new password`}
      </p>

      {message && (
        <div
          style={{
            padding: '10px 14px',
            marginBottom: '20px',
            borderRadius: '6px',
            fontSize: '13px',
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: message.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
            color: message.type === 'success' ? '#15803d' : '#dc2626'
          }}
        >
          {message.text}
        </div>
      )}

      {step === 1 ? (
        /* Step 1: Email Form */
        <form onSubmit={handleSendOtp}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Registered Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        /* Step 2: OTP & New Password Form */
        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              6-Digit OTP Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                letterSpacing: '2px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginBottom: '12px'
            }}
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setMessage(null);
            }}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              color: '#64748b',
              border: 'none',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Resend OTP / Change Email
          </button>
        </form>
      )}

      {onBackToLogin && (
        <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <button
            type="button"
            onClick={onBackToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Back to Login
          </button>
        </div>
      )}
    </div>
  );
}
