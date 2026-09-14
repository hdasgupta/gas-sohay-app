import React, { useState } from 'react';

export default function AdminRescheduleView() {
  // Search Inputs
  const [patientEmail, setPatientEmail] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Found Appointment State
  const [appointment, setAppointment] = useState(null);

  // Reschedule Form States
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Step 1: Search Active Appointment
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError('');
    setAppointment(null);
    setSelectedDate('');
    setAvailableSlots([]);
    setSelectedTime('');
    setStatusMessage({ type: '', text: '' });

    if (!patientEmail || !doctorEmail) {
      setSearchError('Please provide both Patient and Doctor email addresses.');
      return;
    }

    setSearching(true);
    runGAS('findActiveAppointment', [patientEmail, doctorEmail], (res) => {
      setSearching(false);
      if (res.success) {
        setAppointment(res.appointment);
      } else {
        setSearchError(res.message);
      }
    });
  };

  // Step 2: Fetch Available Slots on Date Change
  const handleDateChange = (e) => {
    const dateStr = e.target.value;
    setSelectedDate(dateStr);
    setSelectedTime('');
    setAvailableSlots([]);

    if (!dateStr) return;

    setLoadingSlots(true);
    runGAS(
      'getAvailableSlots',
      [doctorEmail, patientEmail, dateStr, appointment.id],
      (res) => {
        setLoadingSlots(false);
        if (res.success) {
          setAvailableSlots(res.slots);
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      }
    );
  };

  // Step 3: Execute Reschedule Submission
  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setStatusMessage({ type: 'error', text: 'Please select both new date and time slot.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage({ type: '', text: '' });

    runGAS(
      'updateAppointmentSchedule',
      [appointment.id, selectedDate, selectedTime],
      (res) => {
        setSubmitting(false);
        if (res.success) {
          setStatusMessage({ type: 'success', text: res.message });
          setAppointment({
            ...appointment,
            date: selectedDate,
            time: selectedTime,
            status: 'Rescheduled'
          });
          setSelectedTime('');
          setAvailableSlots([]);
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      }
    );
  };

  // Helper for Google Apps Script execution
  const runGAS = (funcName, args, callback) => {
    if (window.google && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(callback)
        .withFailureHandler((err) => {
          setSearching(false);
          setLoadingSlots(false);
          setSubmitting(false);
          setSearchError(err.message || 'Server request failed.');
        })[funcName](...args);
    } else {
      // Mock Data for Local Testing
      setTimeout(() => {
        if (funcName === 'findActiveAppointment') {
          callback({
            success: true,
            appointment: {
              id: 'APT-1002',
              patientemail: patientEmail,
              doctoremail: doctorEmail,
              date: '2026-09-20',
              time: '10:00 AM',
              meetlink: 'https://meet.google.com/xyz-abc-def',
              status: 'Scheduled',
              prescriptionlink: 'N/A'
            }
          });
        } else if (funcName === 'getAvailableSlots') {
          callback({ success: true, slots: ['09:00 AM', '11:00 AM', '02:30 PM'] });
        } else if (funcName === 'updateAppointmentSchedule') {
          callback({ success: true, message: 'Appointment successfully rescheduled.' });
        }
      }, 600);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Admin Appointment Reschedule</h2>

      {/* SEARCH SECTION */}
      <form onSubmit={handleSearch} style={styles.searchCard}>
        <h3>Search Existing Appointment</h3>
        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label>Patient Email:</label>
            <input
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="patient@example.com"
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label>Doctor Email:</label>
            <input
              type="email"
              value={doctorEmail}
              onChange={(e) => setDoctorEmail(e.target.value)}
              placeholder="doctor@example.com"
              required
              style={styles.input}
            />
          </div>
        </div>
        <button type="submit" disabled={searching} style={styles.btnPrimary}>
          {searching ? 'Searching...' : 'Search Appointment'}
        </button>
        {searchError && <p style={styles.errorText}>{searchError}</p>}
      </form>

      {/* APPOINTMENT DETAILS & RESCHEDULE FORM */}
      {appointment && (
        <div style={styles.detailsCard}>
          <h3>Current Appointment Details</h3>
          <div style={styles.grid}>
            <p><strong>ID:</strong> {appointment.id}</p>
            <p><strong>Status:</strong> <span style={styles.badge}>{appointment.status}</span></p>
            <p><strong>Patient:</strong> {appointment.patientEmail || appointment.patientemail}</p>
            <p><strong>Doctor:</strong> {appointment.doctorEmail || appointment.doctoremail}</p>
            <p><strong>Current Date:</strong> {appointment.date}</p>
            <p><strong>Current Time:</strong> {appointment.time}</p>
            <p><strong>Meet Link:</strong> <a href={appointment.meetLink || appointment.meetlink} target="_blank" rel="noreferrer">Join Link</a></p>
            <p><strong>Prescription:</strong> {appointment.prescriptionLink || appointment.prescriptionlink || 'N/A'}</p>
          </div>

          <hr style={styles.divider} />

          <h3>Select New Date & Slot</h3>
          <form onSubmit={handleRescheduleSubmit}>
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label>New Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label>Available Slots (Based on Doctor Schedule):</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={!selectedDate || loadingSlots || availableSlots.length === 0}
                  required
                  style={styles.input}
                >
                  <option value="">
                    {loadingSlots
                      ? 'Checking availability...'
                      : !selectedDate
                      ? 'Select date first'
                      : availableSlots.length === 0
                      ? 'No available slots'
                      : 'Select time slot'}
                  </option>
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedTime}
              style={{ ...styles.btnPrimary, marginTop: '16px' }}
            >
              {submitting ? 'Updating...' : 'Confirm Reschedule'}
            </button>
          </form>

          {statusMessage.text && (
            <div style={statusMessage.type === 'error' ? styles.errorBox : styles.successBox}>
              {statusMessage.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { width: '100%', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' },
  title: { fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' },
  searchCard: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' },
  detailsCard: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' },
  row: { display: 'flex', gap: '16px', marginBottom: '12px' },
  inputGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  input: { padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' },
  btnPrimary: { backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' },
  errorText: { color: '#dc2626', fontSize: '14px', marginTop: '8px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '6px' },
  divider: { margin: '20px 0', borderColor: '#e2e8f0' },
  badge: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' },
  errorBox: { marginTop: '16px', padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '6px' },
  successBox: { marginTop: '16px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '6px' }
};
