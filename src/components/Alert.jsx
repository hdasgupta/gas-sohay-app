import React from 'react';

export default function Alert({ message, styles }) {
  if (!message) return null;
  return <div style={styles.alert}>{message}</div>;
}
