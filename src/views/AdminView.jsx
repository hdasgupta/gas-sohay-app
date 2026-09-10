import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminView({ styles = {} }) {
  const cardStyle = styles.card || { padding: '24px', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '24px' };
  const inputStyle = styles.input || { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' };
  const disabledInputStyle = { ...inputStyle, background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' };
  const btnStyle = styles.btnPrimary || { width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
  const tableHeaderStyle = { padding: '10px', textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '13px' };
  const tableCellStyle = { padding: '10px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' };

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    speciality: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [selectedDays, setSelectedDays] = useState([]);
  const [customSlots, setCustomSlots] = useState([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const [doctorsList, setDoctorsList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = () => {
    setLoadingList(true);
    callBackend('getDoctorsList', [], (list) => {
      setDoctorsList(list || []);
      setLoadingList(false);
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const format12Hr = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    return `${formattedHours}:${m} ${suffix}`;
  };

  const handleAddSlot = () => {
    if (!startTime || !endTime) {
      return setError('Select both start and end time for the slot.');
    }
    const formattedSlot = `${format12Hr(startTime)} - ${format12Hr(endTime)}`;
    if (customSlots.includes(formattedSlot)) {
      return setError('This time slot has already been added.');
    }

    setCustomSlots([...customSlots, formattedSlot]);
    setError('');
  };

  const handleRemoveSlot = (slotToRemove) => {
    setCustomSlots(customSlots.filter((slot) => slot !== slotToRemove));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      speciality: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
    setSelectedDays([]);
    setCustomSlots([]);
    setStartTime('09:00');
    setEndTime('10:00');
    setError('');
  };

  const handleEditClick = (doc) => {
    setEditingId(doc.id);
    setError('');
    setSuccess('');

    setFormData({
      name: doc.name,
      speciality: doc.speciality,
      email: doc.email,
      phone: doc.phone,
      password: '',
      confirmPassword: ''
    });

    try {
      const parsed = JSON.parse(doc.availabilityjson);
      setSelectedDays(parsed.days || []);
      setCustomSlots(parsed.slots || []);
    } catch (e) {
      setSelectedDays([]);
      setCustomSlots([]);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.speciality) {
      return setError('Name and Speciality are required.');
    }

    if (!editingId && (!formData.email || !formData.phone || !formData.password)) {
      return setError('Email, Phone, and Password are required for new doctors.');
    }

    if (formData.password) {
      if (formData.password !== formData.confirmPassword) {
        return setError('Passwords do not match.');
      }
      if (formData.password.length < 6) {
        return setError('Password must be at least 6 characters.');
      }
    }

    if (selectedDays.length === 0) {
      return setError('Select at least one available weekday.');
    }

    if (customSlots.length === 0) {
      return setError('Add at least one dynamic time slot.');
    }

    setSubmitting(true);

    const payload = {
      id: editingId,
      ...formData,
      availability: {
        days: selectedDays,
        slots: customSlots
      }
    };

    callBackend('saveDoctor', [payload], (res) => {
      setSubmitting(false);
      if (res && res.success) {
        setSuccess(res.message);
        resetForm();
        fetchDoctors();
      } else {
        setError(res?.error || 'Failed to save doctor details.');
      }
    });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Dynamic Form */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>{editingId ? `Edit Doctor (${editingId})` : 'Add New Doctor'}</h2>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ padding: '6px 12px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
              Cancel Edit
            </button>
          )}
        </div>

        {error && <div style={{ color: '#dc2626', marginBottom: '12px', padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px' }}>{error}</div>}
        {success && <div style={{ color: '#16a34a', marginBottom: '12px', padding: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Doctor Name *</label>
              <input style={inputStyle} name="name" value={formData.name} onChange={handleInputChange} placeholder="Dr. Jane Doe" required />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Speciality *</label>
              <input style={inputStyle} name="speciality" value={formData.speciality} onChange={handleInputChange} placeholder="Cardiology, General, etc." required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                Email Address {editingId ? '(Immutable)' : '*'}
              </label>
              <input
                style={editingId ? disabledInputStyle : inputStyle}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="doctor@example.com"
                disabled={Boolean(editingId)}
                required={!editingId}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                Phone Number {editingId ? '(Immutable)' : '*'}
              </label>
              <input
                style={editingId ? disabledInputStyle : inputStyle}
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="10-digit phone number"
                disabled={Boolean(editingId)}
                required={!editingId}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                Password {editingId ? '(Leave blank to keep unchanged)' : '*'}
              </label>
              <input style={inputStyle} type="password" name="password" value={formData.password} onChange={handleInputChange} required={!editingId} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                Confirm Password {editingId ? '(Leave blank to keep unchanged)' : '*'}
              </label>
              <input style={inputStyle} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required={!editingId} />
            </div>
          </div>

          {/* Weekday Selector */}
          <div style={{ marginTop: '8px', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Available Weekdays *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {WEEKDAYS.map((day) => {
                const selected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: '1px solid #2563eb',
                      background: selected ? '#2563eb' : '#ffffff',
                      color: selected ? '#ffffff' : '#2563eb',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Time Slot Builder */}
          <div style={{ marginBottom: '20px', padding: '14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
              Configure Time Slots *
            </label>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', display: 'block', color: '#64748b' }}>Start Time</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '11px', display: 'block', color: '#64748b' }}>End Time</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <button
                type="button"
                onClick={handleAddSlot}
                style={{
                  marginTop: '16px',
                  padding: '7px 14px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                + Add Time Slot
              </button>
            </div>

            {/* Configured Slot Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {customSlots.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>No time slots configured. Select times above to add.</span>
              ) : (
                customSlots.map((slot) => (
                  <span
                    key={slot}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid #bae6fd'
                    }}
                  >
                    {slot}
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(slot)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#0369a1',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        padding: 0,
                        marginLeft: '2px'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <button type="submit" disabled={submitting} style={btnStyle}>
            {submitting ? 'Saving...' : editingId ? 'Update Doctor Details' : 'Add Doctor'}
          </button>
        </form>
      </div>

      {/* Doctor List Table */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Registered Doctors List</h3>

        {loadingList ? (
          <p style={{ color: '#64748b' }}>Loading doctor list...</p>
        ) : doctorsList.length === 0 ? (
          <p style={{ color: '#64748b' }}>No doctors found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>ID</th>
                  <th style={tableHeaderStyle}>Name</th>
                  <th style={tableHeaderStyle}>Speciality</th>
                  <th style={tableHeaderStyle}>Contact</th>
                  <th style={tableHeaderStyle}>Availability</th>
                  <th style={tableHeaderStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {doctorsList.map((doc) => {
                  let availSummary = 'Not configured';
                  try {
                    const parsed = doc.availability;
                    availSummary = `${parsed.days?.length || 0} days, ${parsed.slots?.length || 0} slots`;
                  } catch (e) {}

                  return (
                    <tr key={doc.id}>
                      <td style={tableCellStyle}><strong>{doc.id}</strong></td>
                      <td style={tableCellStyle}>{doc.name}</td>
                      <td style={tableCellStyle}>{doc.speciality}</td>
                      <td style={tableCellStyle}>
                        <div>{doc.email}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{doc.phone}</div>
                      </td>
                      <td style={tableCellStyle}>{availSummary}</td>
                      <td style={tableCellStyle}>
                        <button
                          type="button"
                          onClick={() => handleEditClick(doc)}
                          style={{
                            padding: '4px 10px',
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Edit
                        </button>
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
