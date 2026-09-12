import React, { useState } from 'react';
import Captcha from '../components/Captcha';

export default function LoginView({ onSubmit, onNavigateSignup, onNavigateResetPassword, styles }) {
  const [authForm, setAuthForm] = useState({ email: '', password: '', });
  const [captchaInput, setCaptchaInput] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');
  
  const [error, setError] = useState(null);


  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // Validate CAPTCHA
    if (captchaInput.trim().toLowerCase() !== generatedCaptcha.toLowerCase()) {
      setError('Invalid CAPTCHA code. Please try again.');
      return;
    }

    onSubmit(authForm);
  };

  return (
    <>
      {error && (
        <div style={{
          padding: '10px 14px',
          marginBottom: '16px',
          borderRadius: '6px',
          fontSize: '13px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2>Sign In</h2>
        <input required placeholder="Email" style={styles.input} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
        <input required type="password" placeholder="Password" style={styles.input} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
        { /* CAPTCHA Visual + Input Field */ }
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
            Verification Code
          </label>
          
          <div style={{ marginBottom: '10px' }}>
            <Captcha onCaptchaChange={setGeneratedCaptcha} />
          </div>

          <input
            type="text"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            placeholder="Type CAPTCHA text"
            required
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" style={styles.btnPrimary}>Login</button>
        <p>New user? <span style={styles.link} onClick={onNavigateSignup}>Register Here</span></p>
        <p>Forgot password? <span style={styles.link} onClick={onNavigateResetPassword}>Reset Password</span></p>
      </form>
    </>
  );
}
