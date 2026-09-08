import React, { useState } from 'react';
import { callBackend } from '../utils/backend';

export default function SignupView({ onSubmit, onNavigateLogin, styles }) {
  const [formData, setFormData] = useState({ name: '', location: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpStatus, setOtpStatus] = useState('');

  // Password Validation Rules
  const passwordCriteria = {
    minLength: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    isMatched: formData.password.length > 0 && formData.password === formData.confirmPassword
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleSendOtp = () => {
    if (!formData.email) {
      setOtpStatus('Enter an email address first.');
      return;
    }
    setOtpStatus('Sending OTP...');
    callBackend('sendOtp', [formData.email], (res) => {
      setOtpStatus(res.message);
      if (res.success) setIsOtpSent(true);
    });
  };

  const handleVerifyOtp = () => {
    setOtpStatus('Verifying OTP...');
    callBackend('verifyOtp', [formData.email, otp], (res) => {
      setOtpStatus(res.message);
      if (res.success) setIsEmailVerified(true);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isEmailVerified) {
      setOtpStatus('Please verify your email address first.');
      return;
    }
    alert(isPasswordValid)
    if (!isPasswordValid) return;
    alert("submitting...");
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.card}>
      <h2>Patient Registration</h2>

      <input required placeholder="Full Name" style={styles.input} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
      <input required placeholder="Location" style={styles.input} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
      <input required placeholder="Phone Number" style={styles.input} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />

      {/* Email + OTP Controls */}
      <div style={{ marginBottom: '10px' }}>
        <input required type="email" placeholder="Email" disabled={isEmailVerified} style={styles.input} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        
        {!isEmailVerified && (
          <button type="button" onClick={handleSendOtp} style={styles.btnSecondary}>
            {isOtpSent ? 'Resend OTP' : 'Send Verification OTP'}
          </button>
        )}
      </div>

      {isOtpSent && !isEmailVerified && (
        <div style={{ marginBottom: '12px' }}>
          <input placeholder="Enter 6-digit OTP" value={otp} style={styles.input} onChange={(e) => setOtp(e.target.value)} />
          <button type="button" onClick={handleVerifyOtp} style={styles.btnPrimary}>Verify OTP</button>
        </div>
      )}

      {otpStatus && <p style={{ fontSize: '12px', color: isEmailVerified ? '#16a34a' : '#dc2626', margin: '4px 0 12px 0' }}>{otpStatus}</p>}

      {/* Password Inputs */}
      <input required type="password" placeholder="Password" style={styles.input} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
      <input required type="password" placeholder="Confirm Password" style={styles.input} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />

      {/* Real-time Password Rules Feedback */}
      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', marginBottom: '12px', fontSize: '12px' }}>
        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>Password Requirements:</p>
        <div style={{ color: passwordCriteria.minLength ? '#16a34a' : '#dc2626' }}>✓ Minimum 8 characters</div>
        <div style={{ color: passwordCriteria.hasUpper ? '#16a34a' : '#dc2626' }}>✓ At least one uppercase letter (A-Z)</div>
        <div style={{ color: passwordCriteria.hasLower ? '#16a34a' : '#dc2626' }}>✓ At least one lowercase letter (a-z)</div>
        <div style={{ color: passwordCriteria.hasNumber ? '#16a34a' : '#dc2626' }}>✓ At least one number (0-9)</div>
        <div style={{ color: passwordCriteria.hasSpecial ? '#16a34a' : '#dc2626' }}>✓ At least one special character (!@#$%^&*)</div>
        <div style={{ color: passwordCriteria.isMatched ? '#16a34a' : '#dc2626' }}>✓ Passwords match</div>
      </div>

      <button type="submit" disabled={!isEmailVerified || !isPasswordValid} style={{ ...styles.btnPrimary, opacity: (!isEmailVerified || !isPasswordValid) ? 0.5 : 1, cursor: (!isEmailVerified || !isPasswordValid) ? 'not-allowed' : 'pointer' }}>
        Create Account
      </button>

      <p style={{ marginTop: '12px' }}>Already registered? <span style={styles.link} onClick={onNavigateLogin}>Sign In</span></p>
    </form>
  );
}
