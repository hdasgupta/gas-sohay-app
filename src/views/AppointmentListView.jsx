import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';

export default function AppointmentListView({ user, styles }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [user.email]);

  const fetchAppointments = () => {
    setLoading(true);
    callBackend('getUserAppointments', [user.email], (data) => {
      setAppointments(data || []);
      setLoading(false);
    });
  };

  if (loading) {
    return <div style={styles.card}>Loading appointments...</div>;
  }

  return (
    <div style={styles.card}>
      <h2>My Appointments</h2>
      {appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        appointments.map((appt) => (
          <div key={appt.id} style={styles.apptCard}>
            <div style={styles.apptHeader}>
              <strong>ID: {appt.id}</strong>
              <span style={appt.isUpcomingOrPresent ? styles.badgeActive : styles.badgeExpired}>
                {appt.status}
              </span>
            </div>

            <p style={{ margin: '4px 0' }}>
              <strong>Date:</strong> {appt.date} | <strong>Time:</strong> {appt.time}
            </p>

            <p style={{ margin: '4px 0', fontSize: '13px', color: '#64748b' }}>
              {user.role === 'doctor' ? `Patient: ${appt.patient}` : `Doctor: ${appt.doctor}`}
            </p>

            {appt.meetLink ? (
              <div style={{ marginTop: '10px' }}>
                <a href={appt.meetLink} target="_blank" rel="noreferrer" style={styles.meetBtn}>
                  Join Google Meet
                </a>
              </div>
            ) : (
              <div style={styles.expiredNotice}>
                Meeting ended (Google Meet link unavailable for past sessions)
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
