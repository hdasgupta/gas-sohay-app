import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';

export default function AppointmentListView({ user, styles = {} }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const cardStyle = styles.card || {
    padding: '24px',
    background: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    marginBottom: '24px'
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadAppointments = () => {
    setLoading(true);
    setError('');
    callBackend('getAppointmentsForUser', [user?.email || ''], (data) => {
      setLoading(false);
      setAppointments(data || []);
    });
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  // Check if date is today
  const isToday = (dateStr) => {
    return dateStr === getTodayString();
  };

  // Check if appointment date is at least 1 day in the future
  const canCancel = (dateStr, status) => {
    if (status.toLowerCase() === 'cancelled') return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const apptDate = new Date(dateStr + "T00:00:00");
    apptDate.setHours(0, 0, 0, 0);

    const diffInDays = Math.floor((apptDate - today) / (1000 * 60 * 60 * 24));
    return diffInDays >= 1;
  };

  const handleCancelAppointment = (id) => {
    if (!window.confirm(`Are you sure you want to cancel appointment ${id}?`)) return;

    setCancellingId(id);
    setActionMessage(null);
    setError('');

    callBackend('cancelAppointment', [id], (res) => {
      setCancellingId(null);
      if (res && res.success) {
        setActionMessage({ type: 'success', text: res.message });
        loadAppointments();
      } else {
        setActionMessage({ type: 'error', text: res?.error || 'Failed to cancel appointment.' });
      }
    });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1e293b' }}>My Appointments</h2>
          <button
            onClick={loadAppointments}
            style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            Refresh List
          </button>
        </div>

        {actionMessage && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '6px',
            fontSize: '14px',
            background: actionMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: actionMessage.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
            color: actionMessage.type === 'success' ? '#15803d' : '#dc2626'
          }}>
            {actionMessage.text}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '6px' }}>
            No appointments found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px' }}>ID</th>
                  <th style={{ padding: '12px' }}>Patient</th>
                  <th style={{ padding: '12px' }}>Doctor</th>
                  <th style={{ padding: '12px' }}>Date & Time</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => {
                  const todayMatch = isToday(appt.date);
                  const cancellable = canCancel(appt.date, appt.status);
                  const isCancelled = appt.status.toLowerCase() === 'cancelled';

                  return (
                    <tr key={appt.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{appt.id}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>{appt.patientEmail}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>{appt.doctorEmail}</td>
                      <td style={{ padding: '12px', color: '#334155' }}>
                        <div>{appt.date}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{appt.time}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: isCancelled ? '#fef2f2' : '#f0fdf4',
                          color: isCancelled ? '#dc2626' : '#16a34a',
                          border: isCancelled ? '1px solid #fecaca' : '1px solid #bbf7d0'
                        }}>
                          {appt.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* Join Meet Link for Today's Active Appointments */}
                          {todayMatch && !isCancelled && appt.meetLink && (
                            <a
                              href={appt.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '6px 12px',
                                background: '#16a34a',
                                color: '#ffffff',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                display: 'inline-block'
                              }}
                            >
                              Join Meet
                            </a>
                          )}

                          {/* Cancel Button (Enabled if >= 1 day prior) */}
                          {cancellable && (
                            <button
                              onClick={() => handleCancelAppointment(appt.id)}
                              disabled={cancellingId === appt.id}
                              style={{
                                padding: '6px 12px',
                                background: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: cancellingId === appt.id ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                opacity: cancellingId === appt.id ? 0.6 : 1
                              }}
                            >
                              {cancellingId === appt.id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}

                          {!todayMatch && !cancellable && !isCancelled && (
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
