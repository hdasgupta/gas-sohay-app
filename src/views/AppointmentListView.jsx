import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';
import ConfirmBox from '../components/ConfirmBox';

export default function AppointmentListView({ user, styles = {} }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  
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
      setAppointments(data || []);
      setCurrentPage(1); // Reset to first page on reload
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
  
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    message: '',
    targetId: null
  });

  // 1. Trigger confirmation modal
  const handleCancelRequest = (appointmentId) => {
    setConfirmConfig({
      isOpen: true,
      message: `Are you sure you want to cancel appointment ${appointmentId}?`,
      targetId: appointmentId
    });
  };

  // 2. Process callback result (true = confirmed, false = cancelled)
  const handleConfirmResult = (confirmed) => {
    const appointmentId = confirmConfig.targetId;
  
    // Close modal
    setConfirmConfig({ isOpen: false, message: '', targetId: null });
  
    if(confirmed) {
      setCancellingId(appointmentId);
      setActionMessage(null);

      callBackend('cancelAppointment', [appointmentId], (res) => {
        setCancellingId(null);
        if (res && res.success) {
          setActionMessage({ type: 'success', text: res.message });
          loadAppointments();
        } else {
          setActionMessage({ type: 'error', text: res?.error || 'Failed to cancel appointment.' });
        }
      });
    }
  };

  // Pagination Computations
  const totalItems = appointments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAppointments = appointments.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
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

        { /* Custom Confirmation Dialog */ }
        <ConfirmBox
          isOpen={confirmConfig.isOpen}
          message={confirmConfig.message}
          onConfirm={handleConfirmResult}
        />
      
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
          <>
          <center>
          { /* Pagination Controls */ }
          <div
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              {/* Status Info & Page Size Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Showing <b>{totalItems > 0 ? indexOfFirstItem + 1 : 0}</b> to{' '}
                  <b>{Math.min(indexOfLastItem, totalItems)}</b> of <b>{totalItems}</b> appointments
                </span>

                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                </select>
              </div>

              {/* Page Number Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                    color: currentPage === 1 ? '#94a3b8' : '#334155',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: page === currentPage ? '1px solid #2563eb' : '1px solid #cbd5e1',
                      background: page === currentPage ? '#2563eb' : '#ffffff',
                      color: page === currentPage ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: page === currentPage ? 'bold' : 'normal'
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                    color: currentPage === totalPages ? '#94a3b8' : '#334155',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
            </center>
          {/* Multiline Appointment Cards Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentAppointments.map((appt) => {
              const todayMatch = isToday(appt.date);
              const cancellable = canCancel(appt.date, appt.status);
              const isCancelled = appt.status.toLowerCase() === 'cancelled';
              const isCompleted = appt.status.toLowerCase() === 'completed';
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
                    {todayMatch && !isCancelled && ! isCompleted && appt.meetLink && (
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
                        onClick={() => handleCancelRequest(appt.id)}
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

                    {!todayMatch && !cancellable && !isCancelled && !isCompleted && (
                      

                  <ConfirmBox
                    isOpen={confirmConfig.isOpen}
                    message={confirmConfig.message}
                    onConfirm={handleConfirmResult}
                />)}
       
                  </div>
                </div>
              );
            })}
          </div>
          <center>
          { /* Pagination Controls */ }
          <div
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              {/* Status Info & Page Size Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Showing <b>{totalItems > 0 ? indexOfFirstItem + 1 : 0}</b> to{' '}
                  <b>{Math.min(indexOfLastItem, totalItems)}</b> of <b>{totalItems}</b> appointments
                </span>

                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                </select>
              </div>

              {/* Page Number Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                    color: currentPage === 1 ? '#94a3b8' : '#334155',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: page === currentPage ? '1px solid #2563eb' : '1px solid #cbd5e1',
                      background: page === currentPage ? '#2563eb' : '#ffffff',
                      color: page === currentPage ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: page === currentPage ? 'bold' : 'normal'
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                    color: currentPage === totalPages ? '#94a3b8' : '#334155',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
            </center>
          </>
        )}
      </div>
    </div>
  );
}
