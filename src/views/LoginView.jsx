import React, { useState } from 'react';

export default function LoginView({ onSubmit, onNavigateSignup, onNavigateResetPassword, styles }) {
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(authForm);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.card}>
      <h2>Sign In</h2>
      <input required placeholder="Email" style={styles.input} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
      <input required type="password" placeholder="Password" style={styles.input} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
      <button type="submit" style={styles.btnPrimary}>Login</button>
      <p>New user? <span style={styles.link} onClick={onNavigateSignup}>Register Here</span></p>
      <p>Forgot password? <span style={styles.link} onClick={onNavigateResetPassword}>Reset Password</span></p>
    </form>
  );
}
