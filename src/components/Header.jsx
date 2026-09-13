import React from 'react';

export default function Header({ user, onLogout, styles }) {
  if (!user) return null;
  return (
    <div style={styles.header}>
      <span>Logged in: <strong>{user.name}</strong>[{user.email}] ({user.role})</span>
      <button onClick={onLogout} style={styles.btnDanger}>Logout</button>
    </div>
  );
}
