import React, { useState } from 'react';

export default function SignupView({ onSubmit, onNavigateLogin, styles }) {
  const [authForm, setAuthForm] = useState({ name: '', location: '', phone: '', email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(authForm);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.card}>
      <h2>Patient Registration</h2>
      <input required placeholder="Full Name" style={styles.input} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} />
      <input required placeholder="Location" style={styles.input} onChange={(e) => setAuthForm({ ...authForm, location: e.target.value })} />
      <input required placeholder="Phone Number" style={styles.input} onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })} />
      <input required type="email" placeholder="Email" style={styles.input} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
      <input required type="password" placeholder="Password" style={styles.input} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
      <button type="submit" style={styles.btnPrimary}>Create Account</button>
      <p>Already registered? <span style={styles.link} onClick={onNavigateLogin}>Sign In</span></p>
    </form>
  );
}
