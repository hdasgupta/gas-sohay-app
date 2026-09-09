import React, { useState } from 'react';
import DoctorForm from '../components/DoctorForm';
import DoctorList from '../components/DoctorList';

export default function AdminView({ doctors, onSaveDoctor, styles }) {
  const [docForm, setDocForm] = useState({ id: '', name: '', specialty: '', email: '', phone: '', password: '', availability: '' });

  const handleEdit = (d) => {
    setDocForm({ ...d, availability: d.availability.join(',').map((s)=> s.trim())});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveDoctor(docForm, () => {
      setDocForm({ id: '', name: '', specialty: '', email: '', phone: '', password: '', availability: '' });
    });
  };

  return (
    <div style={styles.card}>
      <h2>Admin: Manage Doctors</h2>
      <DoctorForm docForm={docForm} setDocForm={setDocForm} onSubmit={handleSubmit} styles={styles} />
      <DoctorList doctors={doctors} onEdit={handleEdit} styles={styles} />
    </div>
  );
}
