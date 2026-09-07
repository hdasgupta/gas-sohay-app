import React from 'react';

export default function DoctorList({ doctors, onEdit, styles }) {
  return (
    <div>
      <h3>Registered Doctors</h3>
      {doctors.map((d) => (
        <div key={d.id} style={styles.docItem}>
          <div>
            <strong>{d.name}</strong> ({d.specialty})
            <br /><small>{d.email} | Slots: {d.availability.join(', ')}</small>
          </div>
          <button style={styles.btnSecondary} onClick={() => onEdit(d)}>Edit</button>
        </div>
      ))}
    </div>
  );
}
