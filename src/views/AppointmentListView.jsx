import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';

export default function AppointmentListView({ user = {}, styles = {} }) {
  const cardStyle = styles.card || { padding: '24px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' };
  const btnSecondary = styles.btnSecondary || { padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' };

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = () => {
    setLoading(true);
    callBackend('getAppointmentsByUser', [user.email], (data) => {
      setAppointments(data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (user.email) {
      fetchAppointments();
    }
  }, [user.email]);

  if (loading) return <div style={cardStyle}>Loading appointments...</div>;

  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Appointment History</h2>

      {appointments.length === 0 ? (
        <p style={{ color: '#64748b' }}>No appointments found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px' }}>Patient</th>
                <th style={{ padding: '10px' }}>Date</th>
                <th style={{ padding: '10px' }}>Time</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Prescription</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((app, index) => (
                <tr key={app.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>
                    {app.patientName}
                    {app.patientEmail === user.email && (
                      <span style={{ fontSize: '11px', color: '#2563eb', marginLeft: '6px' }}>(You)</span>
                    )}
                  </td>
                  <td style={{ padding: '10px' }}>{app.date}</td>
                  <td style={{ padding: '10px' }}>{app.time}</td>
                  <td style={{ padding: '10px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: app.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                        color: app.status === 'Completed' ? '#166534' : '#92400e'
                      }}
                    >
                      {app.status || 'Scheduled'}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {app.prescriptionUrl ? (
                      <a
                        href={app.prescriptionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={btnSecondary}
                      >
                        📄 View Prescription
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
