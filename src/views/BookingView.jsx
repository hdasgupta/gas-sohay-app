import React, { useState } from 'react';

export default function BookingView({ doctors, user, onSubmitBooking, styles }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [booking, setBooking] = useState({ date: '', time: '' });

  const handleDoctorSelect = (e) => {
    const doc = doctors.find((d) => d.email === e.target.value);
    setSelectedDoc(doc);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitBooking({
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      doctorName: selectedDoc.name,
      doctorEmail: selectedDoc.email,
      date: booking.date,
      time: booking.time
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.card}>
      <h2>Schedule Appointment</h2>
      <label style={styles.label}>Select Doctor</label>
      <select required style={styles.input} onChange={handleDoctorSelect}>
        <option value="">-- Choose Doctor --</option>
        {doctors.map((d) => <option key={d.id} value={d.email}>{d.name} ({d.specialty})</option>)}
      </select>

      <label style={styles.label}>Date</label>
      <input required type="date" style={styles.input} onChange={(e) => setBooking({ ...booking, date: e.target.value })} />

      <label style={styles.label}>Available Timeslots</label>
      <select required style={styles.input} onChange={(e) => setBooking({ ...booking, time: e.target.value })}>
        <option value="">-- Choose Time --</option>
        {selectedDoc ? selectedDoc.availability.map((t) => <option key={t} value={t}>{t}</option>) : null}
      </select>

      <button type="submit" style={styles.btnPrimary}>Confirm & Get Google Meet Link</button>
    </form>
  );
}
