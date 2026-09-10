import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';

export default function BookingView({ user, styles = {} }) {
  const cardStyle = styles.card || {
    padding: '24px',
    background: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    marginBottom: '24px'
  };

  const inputStyle = styles.input || {
    width: '100%',
    padding: '10px',
    marginBottom: '12px',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    boxSizing: 'border-box'
  };

  const btnPrimary = styles.btnPrimary || {
    width: '100%',
    padding: '12px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Selection states
  const [selectedPatientEmail, setSelectedPatientEmail] = useState(user?.email || '');
  const [familyMembers, setFamilyMembers] = useState([])
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctorEmail, setSelectedDoctorEmail] = useState('');
  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');

  // Status states
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    if (user?.email && !selectedPatientEmail) {
      setSelectedPatientEmail(user.email);
    }
  }, [user]);
  
  useEffect(() => {
    if(user?.email) {
      callBackend('getFamilyDetailsByUser', [user.email], (family) => {
          //setLoadingDoctors(false);
          setFamilyMembers(family.members|| []);
        });
      
    }
  }, [user.email])

  // 1. Fetch available doctors on date selection change
  useEffect(() => {
    if (!selectedDate) {
      setAvailableDoctors([]);
      setSelectedDoctorEmail('');
      setAvailableSlots([]);
      setSelectedSlot('');
      return;
    }

    setLoadingDoctors(true);
    setSelectedDoctorEmail('');
    setAvailableSlots([]);
    setSelectedSlot('');
    setError('');

    callBackend('getDoctorsAvailableOnDate', [selectedDate], (doctors) => {
      setLoadingDoctors(false);
      setAvailableDoctors(doctors || []);
    });
  }, [selectedDate]);

  // 2. Fetch available 30-min slots on doctor/date change
  useEffect(() => {
    if (!selectedDoctorEmail || !selectedDate) {
      setAvailableSlots([]);
      setSelectedSlot('');
      return;
    }

    setLoadingSlots(true);
    setSelectedSlot('');
    setError('');

    callBackend('getAvailableSlotsForDoctorAndDate', [selectedDoctorEmail, selectedDate], (slots) => {
      setLoadingSlots(false);
      setAvailableSlots(slots || []);
    });
  }, [selectedDoctorEmail, selectedDate]);

  const handleBookAppointment = (e) => {
    e.preventDefault();
    setError('');
    setBookingSuccess(null);

    if (!selectedPatientEmail) return setError('Please select a patient.');
    if (!selectedDate) return setError('Please choose an appointment date.');
    if (!selectedDoctorEmail) return setError('Please select a doctor.');
    if (!selectedSlot) return setError('Please choose an available 30-minute time slot.');

    const selectedDocObj = availableDoctors.find(d => d.email === selectedDoctorEmail);

    setSubmitting(true);

    const payload = {
      patientEmail: selectedPatientEmail,
      doctorEmail: selectedDoctorEmail,
      doctorName: selectedDocObj?.name || '',
      date: selectedDate,
      time: selectedSlot
    };

    callBackend('bookAppointment', [payload], (res) => {
      setSubmitting(false);
      if (res && res.success) {
        setBookingSuccess(res.appointment);
        setSelectedSlot('');
        // Refresh slot list to immediately hide booked slot
        callBackend('getAvailableSlotsForDoctorAndDate', [selectedDoctorEmail, selectedDate], (slots) => {
          setAvailableSlots(slots || []);
        });
      } else {
        setError(res?.error || 'Failed to book appointment.');
      }
    });
  };

  const selectedDoctorObj = availableDoctors.find((d) => d.email === selectedDoctorEmail);

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', padding: '16px' }}>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Book Doctor Appointment</h2>

        {error && (
          <div style={{ color: '#dc2626', marginBottom: '16px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {bookingSuccess && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ color: '#16a34a', marginTop: 0, marginBottom: '8px' }}>🎉 Appointment Confirmed!</h3>
            <p style={{ fontSize: '13px', color: '#15803d', margin: '0 0 12px 0' }}>
              A confirmation email with Google Meet details has been sent to <strong>{bookingSuccess.patientEmail}</strong>.
            </p>
            <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', background: '#ffffff', padding: '12px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
              <div><strong>Appointment ID:</strong> {bookingSuccess.id}</div>
              <div><strong>Date & Time:</strong> {bookingSuccess.date} at {bookingSuccess.time}</div>
              <div>
                <strong>Google Meet Link:</strong>{' '}
                <a href={bookingSuccess.meetLink} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 'bold' }}>
                  {bookingSuccess.meetLink}
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBookingSuccess(null)}
              style={{ marginTop: '12px', padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              Book Another Appointment
            </button>
          </div>
        )}

        <form onSubmit={handleBookAppointment}>
          {/* Step 1: Patient Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#334155' }}>
              1. Select Patient *
            </label>
            {familyMembers && familyMembers.length > 0 ? (
              <select
                style={inputStyle}
                value={selectedPatientEmail}
                onChange={(e) => setSelectedPatientEmail(e.target.value)}
                required
              >
                <option value={user?.email}>Self ({user?.email})</option>
                {familyMembers.map((member, index) => (
                  <option key={index} value={member.email}>
                    {member.name} ({member.relation || 'Family'}) - {member.email}
                  </option>
                ))}
              </select>
            ) : (
              <input
                style={{ ...inputStyle, background: '#f8fafc', color: '#475569' }}
                type="email"
                value={selectedPatientEmail}
                readOnly
                required
              />
            )}
          </div>

          {/* Step 2: Date Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#334155' }}>
              2. Select Date *
            </label>
            <input
              type="date"
              style={inputStyle}
              min={getTodayString()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>

          {/* Step 3: Doctor Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#334155' }}>
              3. Select Available Doctor *
            </label>
            {loadingDoctors ? (
              <div style={{ padding: '10px', color: '#64748b', fontSize: '13px' }}>Loading doctors available on this date...</div>
            ) : availableDoctors.length === 0 ? (
              <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#64748b', fontSize: '13px' }}>
                No doctors are available on this date. Please pick another date.
              </div>
            ) : (
              <select
                style={inputStyle}
                value={selectedDoctorEmail}
                onChange={(e) => setSelectedDoctorEmail(e.target.value)}
                required
              >
                <option value="">-- Choose a Doctor --</option>
                {availableDoctors.map((doc) => (
                  <option key={doc.id} value={doc.email}>
                    Dr. {doc.name} ({doc.specialty})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 4: 30-Minute Time Slot Picker */}
          {selectedDoctorEmail && (
            <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#334155' }}>
                4. Select 30-Min Time Slot *
              </label>

              {loadingSlots ? (
                <div style={{ color: '#64748b', fontSize: '13px' }}>Fetching available slots...</div>
              ) : availableSlots.length === 0 ? (
                <div style={{ color: '#dc2626', fontSize: '13px' }}>
                  All time slots for Dr. {selectedDoctorObj?.name} on {selectedDate} are fully booked.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          color: isSelected ? '#1d4ed8' : '#334155',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          cursor: 'pointer',
                          fontSize: '12px',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedDoctorEmail || !selectedSlot}
            style={{
              ...btnPrimary,
              opacity: submitting || !selectedDoctorEmail || !selectedSlot ? 0.6 : 1,
              cursor: submitting || !selectedDoctorEmail || !selectedSlot ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Generating Meet & Booking...' : 'Confirm Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
}
