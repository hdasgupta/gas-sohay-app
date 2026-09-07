import React from 'react';

export default function DoctorForm({ docForm, setDocForm, onSubmit, styles }) {
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: '20px' }}>
      <input placeholder="Doctor Name" value={docForm.name} style={styles.input} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} required />
      <input placeholder="Specialty" value={docForm.specialty} style={styles.input} onChange={(e) => setDocForm({ ...docForm, specialty: e.target.value })} required />
      <input placeholder="Email" value={docForm.email} style={styles.input} onChange={(e) => setDocForm({ ...docForm, email: e.target.value })} required />
      <input placeholder="Phone" value={docForm.phone} style={styles.input} onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })} required />
      <input placeholder="Password" value={docForm.password} style={styles.input} onChange={(e) => setDocForm({ ...docForm, password: e.target.value })} required />
      <input placeholder="Slots (e.g. 09:00, 10:00, 14:00)" value={docForm.availability} style={styles.input} onChange={(e) => setDocForm({ ...docForm, availability: e.target.value })} required />
      <button type="submit" style={styles.btnPrimary}>{docForm.id ? 'Update Doctor' : 'Add Doctor'}</button>
    </form>
  );
}
