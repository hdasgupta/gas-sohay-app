import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';
import SuggestionBox from '../components/SuggestionBox';
import MessageBox from '../components/MessageBox';
import LoaderMessage from '../components/LoaderMessage';

export default function AdminRescheduleView() {
  const [patientName, setPatientName]= useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [doctorName, setDoctoeName] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');

  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [doctorSuggestions, setDoctorSuggestions] = useState([]);

  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [appointment, setAppointment] = useState(null);

  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    callBackend('getSuggestionOptions', [], (res) => {
      if (res) {
        setDoctorSuggestions(res.doctors.map((doctor) => {
          return {
            label: doctor.name, 
            value: doctor.email
          }
        })|| []);
        setPatientSuggestions(res.patients.map((patient) => {
          return {
            label: patient.name, 
            value: patient.email
          }
        })|| []);
      }
    });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError('');
    setAppointment(null);
    setSelectedDate('');
    setAvailableSlots([]);
    setSelectedTime('');
    setStatusMessage({ type: '', text: '' });

    if (!patientEmail || !doctorEmail) {
      setSearchError('Please provide both Patient and Doctor name.');
      return;
    }

    setSearching(true);
    callBackend('findActiveAppointment', [patientEmail, doctorEmail], (res) => {
      setSearching(false);
      if (res.success) {
        setAppointment(res.appointment);
      } else {
        setSearchError(res.message);
      }
    });
  };

  const handleDateChange = (e) => {
    const dateStr = e.target.value;
    setSelectedDate(dateStr);
    setSelectedTime('');
    setAvailableSlots([]);

    if (!dateStr) return;

    setLoadingSlots(true);
    callBackend(
      'getAvailableSlots',
      [doctorEmail, patientEmail, dateStr, appointment.id],
      (res) => {
        setLoadingSlots(false);
        if (res.success) {
          setAvailableSlots(res.slots);
          if (res.message) {
            setStatusMessage({ type: 'info', text: res.message });
          }
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      }
    );
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    setSubmitting(true);
    setStatusMessage({ type: '', text: '' });

    callBackend(
      'updateAppointmentSchedule',
      [appointment.id, selectedDate, selectedTime],
      (res) => {
        setSubmitting(false);
        if (res.success) {
          setStatusMessage({ type: 'success', text: res.message });
          setAppointment((prev) => ({
            ...prev,
            date: selectedDate,
            time: selectedTime,
            status: 'Rescheduled'
          }));
          setSelectedTime('');
          setAvailableSlots([]);
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      }
    );
  };

  return (
    <div style={styles.container}>
      <h2>Admin Reschedule View</h2>

      {/* SEARCH CARD */}
      <form onSubmit={handleSearch} style={styles.card}>
        <h3>Search Active Appointment</h3>
        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.externalLabel}>Patient</label>
            <SuggestionBox
              suggestions={patientSuggestions}
              
              onSuggSelect={(patient) =>{
                setPatientEmail(patient.value);
                setPatientName(patient.label)
              }}
              minCharsToSuggest={0}
              clearOnSelect={false}
              placeholder="Select or type patient name..."
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.externalLabel}>Doctor </label>
            <SuggestionBox
              suggestions={doctorSuggestions}
              
              onSuggSelect={(doctor) => {
                setDoctorEmail(doctor.value);
                setDoctoeName(doctor.label)
              }}
              minCharsToSuggest={0}
              clearOnSelect={false}
              placeholder="Select or type doctor name..."
            />
          </div>
        </div>

        <button type="submit" disabled={searching} style={styles.btnPrimary}>
          {searching ? <LoaderMessage
            align="center"
            message="Searching..."
          /> : 'Find Appointment'}
        </button>
        {searchError && <MessageBox
            message={searchError}
            type="error"
            duration={10}
          /> }
      </form>

      {/* DETAILS AND RESCHEDULE FORM */}
      {appointment && (
        <div style={styles.card}>
          <h3>Current Appointment Details</h3>
          <div style={styles.grid}>
            <p><strong>Appointment ID:</strong> {appointment.id}</p>
            <p><strong>Status:</strong> {appointment.status}</p>
            <p><strong>Patient Email:</strong> {appointment.patientemail}</p>
            <p><strong>Doctor Email:</strong> {appointment.doctoremail}</p>
            <p><strong>Current Date:</strong> {appointment.date}</p>
            <p><strong>Current Time:</strong> {appointment.time}</p>
            <p><strong>Meet Link:</strong> <a href={appointment.meetlink} target="_blank" rel="noreferrer">Open Google Meet</a></p>
            <p><strong>Prescription:</strong> {appointment.prescriptionlink || 'N/A'}</p>
          </div>

          <hr style={styles.divider} />

          <h3>Select Reschedule Time (30-min Slots)</h3>
          <form onSubmit={handleRescheduleSubmit}>
            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.externalLabel}>New Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.externalLabel}>30-Minute Time Slot</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={!selectedDate || loadingSlots || availableSlots.length === 0}
                  required
                  style={styles.input}
                >
                  <option value="">
                    {loadingSlots
                      ? 'Loading slots...'
                      : !selectedDate
                      ? 'Select date first'
                      : availableSlots.length === 0
                      ? 'No available slots'
                      : 'Select slot'}
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
              {submitting ? <LoaderMessage 
                  align="center"
                  message="Updating..."
                />  : 'Confirm Reschedule'}
            </button>
          </form>

          {statusMessage.text && (
            <MessageBox
              message={statusMessage.text}
              type={statusMessage.type}
              duration={10}
            />
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '780px', margin: '0 auto', fontFamily: 'sans-serif' },
  card: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' },
  row: { display: 'flex', gap: '16px', marginBottom: '14px' },
  fieldGroup: { flex: 1, display: 'flex', flexDirection: 'column' },
  externalLabel: { fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#334155' },
  input: { width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' },
  btnPrimary: { backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' },
  errorText: { color: '#dc2626', fontSize: '14px', marginTop: '8px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '14px' },
  divider: { margin: '20px 0', borderColor: '#f1f5f9' },
  errorBox: { marginTop: '14px', padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '6px' },
  successBox: { marginTop: '14px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '6px' }
};
