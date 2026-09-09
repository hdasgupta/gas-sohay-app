import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';

export default function AppointmentListView({ user = {}, styles = {} }) {
  const cardStyle = styles.card || { padding: '24px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' };
  const inputStyle = styles.input || { padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' };
  const btnSecondary = styles.btnSecondary || { padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' };

  const [familyInfo, setFamilyInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedFilterEmail, setSelectedFilterEmail] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.email) {
      setLoading(true);
      callBackend('getAppointmentsForUserAndFamily', [user.email], (res) => {
        if (res) {
          setFamilyInfo(res.familyInfo || null);
          setAppointments(res.appointments || []);
        }
        setLoading(false);
      });
    }
  }, [user.email]);

  const filteredAppointments = appointments.filter((app) => {
    if (selectedFilterEmail === 'ALL') return true;
    return app.patientEmail.toLowerCase() === selectedFilterEmail.toLowerCase();
  });

  if (loading) return <div style={cardStyle}>Loading appointment schedule...</div>;

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Appointment Records</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            {familyInfo
              ? `Showing records for ${familyInfo.familyName} (${familyInfo.members.length} members)`
              : 'Individual Patient Account'}
          </p>
        </div>

        {/* Member Filter Dropdown for Family Accounts */}
        {familyInfo && familyInfo.members && familyInfo.members.length > 0 && (
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '8px', color: '#475569' }}>Filter Member:</label>
            <select
              style={inputStyle}
              value={selectedFilterEmail}
              onChange={(e) => setSelectedFilterEmail(e.target.value)}
            >
              <option value="ALL">All Family Members</option>
              {familyInfo.members.map((m) => (
                <option key={m.email} value={m.email}>
                  {m.name} {m.email === user.email ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Family Overview Header */}
      {familyInfo && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Family Members in {familyInfo.familyName} (ID: {familyInfo.familyId})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {familyInfo.members.map((m) => (
              <div
                key={m.email}
                onClick={() => setSelectedFilterEmail(m.email)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedFilterEmail === m.email ? '#2563eb' : '#cbd5e1',
                  background: selectedFilterEmail === m.email ? '#eff6ff' : '#ffffff',
                  color: selectedFilterEmail === m.email ? '#1e40af' : '#334155',
                  fontWeight: selectedFilterEmail === m.email ? 'bold' : 'normal'
                }}
              >
                👤 {m.name} {m.age ? `(${m.age} yrs)` : ''} {m.email === user.email ? '★' : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointments Data Table */}
      {filteredAppointments.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', margin: '30px 0' }}>No appointments found for the selected view.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px' }}>Patient Name</th>
                <th style={{ padding: '10px' }}>Email</th>
                <th style={{ padding: '10px' }}>Date</th>
                <th style={{ padding: '10px' }}>Time</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Prescription</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((app, index) => (
                <tr key={app.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>
                    {app.patientName}
                    {app.patientAge && <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal', marginLeft: '4px' }}>({app.patientAge}y)</span>}
                    {app.patientEmail === user.email && (
                      <span style={{ fontSize: '11px', color: '#2563eb', marginLeft: '6px' }}>(You)</span>
                    )}
                  </td>
                  <td style={{ padding: '10px', color: '#475569', fontSize: '13px' }}>{app.patientEmail}</td>
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
