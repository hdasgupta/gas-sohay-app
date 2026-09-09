import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';

export default function BookingView({ user = {}, styles = {} }) {
  const cardStyle = styles.card || { padding: '24px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' };
  const inputStyle = styles.input || { width: '100%', padding: '10px', marginBottom: '14px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' };
  const btnStyle = styles.btnPrimary || { width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

  const todayStr = new Date().toISOString().split('T')[0];

  const [availableSlots, setAvailableSlots] = useState([]);

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorEmail, setSelectedDoctorEmail] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedPatientEmail, setSelectedPatientEmail] = useState(user.email || '');
  const [selectedPatientName, setSelectedPatientName] = useState(user.name || '');
  const [appointmentDate, setAppointmentDate] = useState(todayStr);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load doctors and family members on mount
  useEffect(() => {
    callBackend('getDoctorsList', [], (docList) => {
      if (docList && docList.length > 0) {
        
        setDoctors(docList);
        setSelectedDoctorEmail(docList[0].email);
      }
    });

    if (user.email) {
      callBackend('getFamilyDetailsByUser', [user.email], (data) => {
        
        if (data && data.members && data.members.length > 0) {
          setFamilyMembers(data.members);
        }
      });
      
      
    }
  }, [user.email]);

  // Fetch booked slots whenever selected Doctor or Date changes
  useEffect(() => {
    if (selectedDoctorEmail && appointmentDate) {
      setLoadingSlots(true);
      callBackend('getBookedSlotsForDoctorAndDate', [selectedDoctorEmail, appointmentDate], (slots) => {
        setBookedSlots(slots || []);
        setLoadingSlots(false);
        setAppointmentTime('');
      });
      
      callBackend('getDoctorByEmail', [selectedDoctorEmail], (data) => {
  if (data && data.availability && data.availability.length > 0) {
    setAvailableSlots(data.availability);
  }
});
    }
  }, [selectedDoctorEmail, appointmentDate]);

  const handlePatientSelectChange = (e) => {
    const chosenEmail = e.target.value;
    setSelectedPatientEmail(chosenEmail);
    const member = familyMembers.find((m) => m.email.toLowerCase() === chosenEmail.toLowerCase());
    setSelectedPatientName(member ? member.name : user.name);
  };

  const handleBookAppointment = (e) => {
    e.preventDefault();
    if (!selectedDoctorEmail || !appointmentDate || !appointmentTime) {
      return alert('Please select a doctor, date, and available time slot.');
    }

    setSubmitting(true);
    const payload = {
      patientEmail: selectedPatientEmail,
      patientName: selectedPatientName,
      bookedByEmail: user.email,
      doctorEmail: selectedDoctorEmail,
      date: appointmentDate,
      time: appointmentTime
    };

    callBackend('bookAppointment', [payload], (res) => {
      setSubmitting(false);
      if (res && res.success) {
        alert(`Appointment booked successfully for ${selectedPatientName} on ${appointmentDate} at ${appointmentTime}!`);
        
        // Refresh booked slots
        callBackend('getBookedSlotsForDoctorAndDate', [selectedDoctorEmail, appointmentDate], (slots) => {
          setBookedSlots(slots || []);
          setAppointmentTime('');
        });
      } else {
        alert('Booking failed: ' + (res?.error || 'Unknown error'));
      }
    });
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Book Doctor Appointment</h2>

      <form onSubmit={handleBookAppointment}>
        {/* Family Member Selection */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
            Book Appointment For
          </label>
          {familyMembers.length > 0 ? (
            <select style={inputStyle} value={selectedPatientEmail} onChange={handlePatientSelectChange}>
              {familyMembers.map((m) => (
                <option key={m.email} value={m.email}>
                  {m.name} {m.email.toLowerCase() === user.email.toLowerCase() ? '(You)' : `(${m.email})`}
                </option>
              ))}
            </select>
          ) : (
            <input style={inputStyle} value={`${selectedPatientName} (${selectedPatientEmail})`} readOnly />
          )}
        </div>

        {/* Doctor Selection */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
            Select Doctor
          </label>
          <select
            style={inputStyle}
            value={selectedDoctorEmail}
            onChange={(e) => setSelectedDoctorEmail(e.target.value)}
            required
          >
            {doctors.length === 0 && <option value="">Loading doctors...</option>}
            {doctors.map((doc) => (
              <option key={doc.email} value={doc.email}>
                {doc.name} — {doc.specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection (Today Onwards) */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
            Appointment Date
          </label>
          <input
            type="date"
            min={todayStr}
            style={inputStyle}
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            required
          />
        </div>

        {/* Time Slot Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
            Select Time Slot {loadingSlots && <span style={{ color: '#2563eb', fontWeight: 'normal' }}>(Checking doctor's schedule...)</span>}
          </label>
          <select
            style={inputStyle}
            value={appointmentTime}
            onChange={(e) => setAppointmentTime(e.target.value)}
            disabled={loadingSlots || !appointmentDate || !selectedDoctorEmail}
            required
          >
            <option value="">-- Choose Time Slot --</option>
            {availableSlots.length && availableSlots.map((slot) => {
              const isBooked = bookedSlots.includes(slot);
              return (
                <option key={slot} value={slot} disabled={isBooked}>
                  {slot} {isBooked ? '(Doctor Occupied)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <button type="submit" disabled={submitting || loadingSlots} style={btnStyle}>
          {submitting ? 'Confirming Booking...' : 'Confirm Appointment'}
        </button>
      </form>
    </div>
  );
}
