import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';

export default function AppointmentBookingView({ user = {}, styles = {} }) {
  const cardStyle = styles.card || { padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' };
  const inputStyle = styles.input || { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
  const btnStyle = styles.btnPrimary || { width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedPatientEmail, setSelectedPatientEmail] = useState(user.email || '');
  const [selectedPatientName, setSelectedPatientName] = useState(user.name || '');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user.email) {
      callBackend('getFamilyDetailsByUser', [user.email], (data) => {
        if (data && data.members && data.members.length > 0) {
          setFamilyMembers(data.members);
        }
      });
    }
  }, [user.email]);

  const handlePatientSelectChange = (e) => {
    const chosenEmail = e.target.value;
    setSelectedPatientEmail(chosenEmail);
    const member = familyMembers.find((m) => m.email === chosenEmail);
    setSelectedPatientName(member ? member.name : user.name);
  };

  const handleBookAppointment = () => {
    if (!appointmentDate || !appointmentTime) {
      return alert('Select date and time.');
    }

    setLoading(true);
    const payload = {
      patientEmail: selectedPatientEmail,
      patientName: selectedPatientName,
      bookedByEmail: user.email,
      date: appointmentDate,
      time: appointmentTime
    };

    callBackend('bookAppointment', [payload], (res) => {
      setLoading(false);
      if (res && res.success) {
        alert(`Appointment booked successfully for ${selectedPatientName}!`);
      } else {
        alert('Booking failed: ' + (res?.error || 'Unknown error'));
      }
    });
  };

  return (
    <div style={cardStyle}>
      <h2>Book Appointment</h2>

      {familyMembers.length > 0 && (
        <div style={{ marginBottom: '14px', background: '#eff6ff', padding: '12px', borderRadius: '6px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#1e40af' }}>
            Select Family Member
          </label>
          <select style={inputStyle} value={selectedPatientEmail} onChange={handlePatientSelectChange}>
            {familyMembers.map((m) => (
              <option key={m.email} value={m.email}>
                {m.name} ({m.email === user.email ? 'Myself' : m.email})
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Patient Name</label>
        <input style={inputStyle} value={selectedPatientName} readOnly />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Patient Email</label>
        <input style={inputStyle} value={selectedPatientEmail} readOnly />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Date</label>
          <input type="date" style={inputStyle} value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Time Slot</label>
          <input type="time" style={inputStyle} value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} />
        </div>
      </div>

      <button onClick={handleBookAppointment} disabled={loading} style={btnStyle}>
        {loading ? 'Booking...' : 'Confirm Appointment'}
      </button>
    </div>
  );
}
