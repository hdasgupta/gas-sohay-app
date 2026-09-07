import React from 'react';

export default function MeetLinkCard({ confirmation, user, onReset, styles }) {
  return (
    <div style={styles.card}>
      <h2>Booking Complete</h2>
      <p>Confirmation Email sent to: <strong>{user.email}</strong></p>
      <div style={styles.meetBox}>
        <p><strong>Google Meet Link:</strong></p>
        <a href={confirmation.meetLink} target="_blank" rel="noreferrer" style={styles.meetBtn}>
          Join Video Call
        </a>
      </div>
      <button style={styles.btnPrimary} onClick={onReset}>Back to Dashboard</button>
    </div>
  );
}
