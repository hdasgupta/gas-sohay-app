import React from 'react';

export default function Header({ logo, user, orgName, onLogout, styles }) {
  if (!user) return null;
  return (
    <>
    <div style={styles.header}>
      <span>Logged in: <strong>{user.name}</strong>[{user.email}] ({user.role})</span>
      <button onClick={onLogout} style={styles.btnDanger}>Logout</button>
      
    </div>
    <div style={styles.org}>
        <img 
          src={logo} 
          alt={`${orgName} Logo`} 
          className="header-logo" 
          height="100"
          width="100"
        />
        <h1>{orgName}</h1>
      </div>
      </>
  );
}
