import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';

export default function AppointmentListView({ user, styles = {} }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const cardStyle = styles.card || {
    padding: '24px',
    background: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
    callBackend('getAppointmentsForUser', [user?.email || ''], (data) => {
      setLoading(false);
      alert(JSON.stringify(data))
      setAppointments(data || []);
    });
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const isToday = (dateStr) => dateStr === getTodayString();

  const canCancel = (dateStr, status) => {
    if (status.toLowerCase() === 'cancelled') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const apptDate = new Date(dateStr + 'T00:00:00');
    apptDate.setHours(0, 0, 0, 0);

    const diffInDays = Math.floor((apptDate - today) / (1000 * 60 * 60 * 24));
    return diffInDays >= 1;
  };

  const handleCancelAppointment = (id) => {
    if (!window.confirm(`Are you sure you want to cancel appointment ${id}?`)) return;

    setCancellingId(id);
    setActionMessage(null);

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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
      <div style={cardStyle}>
        {/* View Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>My Appointments</h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
              View and manage your upcoming consultations
            </p>
          </div>
          <button
            onClick={loadAppointments}
            style={{
              padding: '8px 16px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155'
            }}
          >
            Refresh
          </button>
        </div>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '6px',
              fontSize: '14px',
              background: actionMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: actionMessage.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
              color: actionMessage.type === 'success' ? '#15803d' : '#dc2626'
            }}
          >
            {actionMessage.text}
          </div>
        )}

        {/* Loading / Empty State */}
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
            No appointments scheduled yet.
          </div>
        ) : (
          /* Multiline Appointment Cards Container */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {appointments.map((appt) => {
              const todayMatch = isToday(appt.date);
              const cancellable = canCancel(appt.date, appt.status);
              const isCancelled = appt.status.toLowerCase() === 'cancelled';
              const hasPrescription = appt.prescriptionLink;
              
              return (
                <div
                  key={appt.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px',
                    background: isCancelled ? '#fafafa' : '#ffffff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  {/* Row 1: Header Info (ID & Status Badge) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px dashed #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>
                        ID: {appt.id}
                      </span>
                      {todayMatch && !isCancelled && (
                        <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                          Today's Session
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: isCancelled ? '#fef2f2' : '#f0fdf4',
                        color: isCancelled ? '#dc2626' : '#16a34a',
                        border: isCancelled ? '1px solid #fecaca' : '1px solid #bbf7d0'
                      }}
                    >
                      {appt.status}
                    </span>
                  </div>

                  {/* Row 2: Detailed Attributes (Multiline Structured Grid) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                    {/* Patient Details */}
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                        Patient
                      </div>
                      <div style={{ fontSize: '14px', color: '#334155', fontWeight: '500', marginTop: '2px' }}>
                        {appt.patient.name}
                      </div>
                    </div>

                    {/* Doctor Details */}
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                        Doctor
                      </div>
                      <div style={{ fontSize: '14px', color: '#334155', fontWeight: '500', marginTop: '2px' }}>
                        {appt.doctor.name}
                      </div>
                    </div>

                    {/* Schedule Details */}
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                        Date & Time Slot
                      </div>
                      <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600', marginTop: '2px' }}>
                        📅 {appt.date} <span style={{ color: '#2563eb', marginLeft: '6px' }}>⏰ {appt.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    {/* Prescription Download Button */}
                    {hasPrescription && (
                      <a
                        href={appt.prescriptionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '8px 16px',
                          background: '#0284c7',
                          color: '#ffffff',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        📄 Download Prescription
                      </a>
                    )}
                    {/* Join Google Meet Button */}
                    {todayMatch && !isCancelled && appt.meetLink && (
                      <a
                        href={appt.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '8px 16px',
                          background: '#16a34a',
                          color: '#ffffff',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        🎥 Join Google Meet
                      </a>
                    )}

                    {/* Cancel Appointment Button */}
                    {cancellable && (
                      <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        disabled={cancellingId === appt.id}
                        style={{
                          padding: '8px 16px',
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: cancellingId === appt.id ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          opacity: cancellingId === appt.id ? 0.6 : 1
                        }}
                      >
                        {cancellingId === appt.id ? 'Cancelling...' : 'Cancel Appointment'}
                      </button>
                    )}

                    {!todayMatch && !cancellable && !isCancelled && (
                      <span style={{ fontSize: '12px', color: '#94a3b8', italic: 'true' }}>
                        Cancellation allowed at least 1 day prior
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
