import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';
import ConfirmBox from '../components/ConfirmBox';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminView({ styles = {} }) {
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
  const disabledInputStyle = { ...inputStyle, background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' };
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

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Per-day Availability State: { "Monday": ["09:00 AM - 11:00 AM"], "Wednesday": ["02:00 PM - 05:00 PM"] }
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [activeDayTab, setActiveDayTab] = useState('Monday');
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('12:00');

  const [doctorsList, setDoctorsList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    message: '',
    targetDoc: null
  });
  
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

  const format12Hr = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    return `${formattedHours}:${m} ${suffix}`;
  };

  const handleAddSlotToActiveDay = () => {
    if (!slotStartTime || !slotEndTime) {
      return setError(`Please specify start and end time for ${activeDayTab}.`);
    }

    const formattedSlot = `${format12Hr(slotStartTime)} - ${format12Hr(slotEndTime)}`;
    const currentDaySlots = availabilityMap[activeDayTab] || [];

    if (currentDaySlots.includes(formattedSlot)) {
      return setError(`This time slot is already added for ${activeDayTab}.`);
    }

    setAvailabilityMap({
      ...availabilityMap,
      [activeDayTab]: [...currentDaySlots, formattedSlot]
    });
    setError('');
  };

  const handleRemoveSlot = (day, slotToRemove) => {
    const updatedSlots = (availabilityMap[day] || []).filter((s) => s !== slotToRemove);
    const updatedMap = { ...availabilityMap };

    if (updatedSlots.length === 0) {
      delete updatedMap[day];
    } else {
      updatedMap[day] = updatedSlots;
    }

    setAvailabilityMap(updatedMap);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      specialty: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
    setAvailabilityMap({});
    setActiveDayTab('Monday');
    setSlotStartTime('09:00');
    setSlotEndTime('12:00');
    setError('');
  };

  const handleEditClick = (doc) => {
    setEditingId(doc.id);
    setError('');
    setSuccess('');

    setFormData({
      name: doc.name,
      specialty: doc.speciality,
      email: doc.email,
      phone: doc.phone,
      password: '',
      confirmPassword: ''
    });

    try {
      const parsed = JSON.parse(doc.availabilityjson);
      setAvailabilityMap(parsed && typeof parsed === 'object' ? parsed : {});
    } catch (e) {
      setAvailabilityMap({});
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (doc) => {
    setConfirmConfig({
      isOpen: true,
      message: `Are you sure you want to remove Dr. ${doc.name} (${doc.id})?`,
      targetDoc: doc
    });
    
  };
  
  const handleConfirmResult = (confirmed) => {
    const doc = confirmConfig.targetDoc;
    
    // Close modal
    setConfirmConfig({ isOpen: false, message: '', targetId: null });
    
    if (confirmed) {
      setDeletingId(doc.id);
      setError('');
      setSuccess('');

      callBackend('deleteDoctor', [doc.id], (res) => {
        setDeletingId(null);
        if (res && res.success) {
          setSuccess(res.message);
          if (editingId === doc.id) {
            resetForm();
          }
          fetchDoctors();
        } else {
          setError(res?.error || 'Failed to delete doctor.');
        }
      });
    }
  };

  const validatePasswordComplexity = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter (A-Z).';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter (a-z).';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number (0-9).';
    if (!/[!@#$%^&*(),.?":{}|<>\-_=+\\|/\[\];']/.test(pwd)) return 'Password must contain at least one special character.';
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.specialty) {
      return setError('Doctor Name and Specialty are required.');
    }

    if (!editingId && (!formData.email || !formData.phone || !formData.password)) {
      return setError('Email, Phone, and Password are required for new doctors.');
    }

    if (formData.password) {
      if (formData.password !== formData.confirmPassword) {
        return setError('Passwords do not match.');
      }
      const pwdError = validatePasswordComplexity(formData.password);
      if (pwdError) return setError(pwdError);
    }

    const configuredDays = Object.keys(availabilityMap).filter(
      (day) => Array.isArray(availabilityMap[day]) && availabilityMap[day].length > 0
    );

    if (configuredDays.length === 0) {
      return setError('Please add at least one time slot for any weekday.');
    }

    setSubmitting(true);

    const payload = {
      id: editingId,
      ...formData,
      availability: availabilityMap
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
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '16px' }}>
      {/* Form Card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, color: '#1e293b' }}>
            {editingId ? `Edit Doctor (${editingId})` : 'Add New Doctor'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{ padding: '6px 12px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              Cancel Edit
            </button>
          )}
        </div>
       
       { /* Custom Confirmation Dialog */ }
       <ConfirmBox
          isOpen={confirmConfig.isOpen}
          message={confirmConfig.message}
          onConfirm={handleConfirmResult}
        />
        
        {error && <div style={{ color: '#dc2626', marginBottom: '14px', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '13px' }}>{error}</div>}
        {success && <div style={{ color: '#16a34a', marginBottom: '14px', padding: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '13px' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Doctor Name *</label>
              <input style={inputStyle} name="name" value={formData.name} onChange={handleInputChange} placeholder="Dr. Jane Doe" required />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Specialty *</label>
              <input style={inputStyle} name="specialty" value={formData.specialty} onChange={handleInputChange} placeholder="Cardiology, Dermatology, etc." required />
            </div>
          </div>

          {/* Contact Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Email Address {editingId ? '(Immutable)' : '*'}</label>
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
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Phone Number {editingId ? '(Immutable)' : '*'}</label>
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

          {/* Password Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Password {editingId ? '(Optional)' : '*'}</label>
              <input style={inputStyle} type="password" name="password" value={formData.password} onChange={handleInputChange} required={!editingId} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Confirm Password {editingId ? '(Optional)' : '*'}</label>
              <input style={inputStyle} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required={!editingId} />
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '-6px', marginBottom: '16px' }}>
            * Password rules: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character.
          </p>

          {/* Weekday & Time Slot Availability Builder */}
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#334155' }}>
              Configure Weekday Availability & Time Slots
            </label>

            {/* Weekday Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '14px' }}>
              {WEEKDAYS.map((day) => {
                const isActive = activeDayTab === day;
                const slotCount = (availabilityMap[day] || []).length;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setActiveDayTab(day)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '4px 4px 0 0',
                      border: '1px solid #cbd5e1',
                      borderBottom: isActive ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: isActive ? '#ffffff' : '#f1f5f9',
                      color: isActive ? '#2563eb' : '#475569',
                      fontWeight: isActive ? 'bold' : 'normal',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {day} {slotCount > 0 && <span style={{ background: '#2563eb', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', marginLeft: '4px' }}>{slotCount}</span>}
                  </button>
                );
              })}
            </div>

            {/* Time Slot Controls for Selected Day */}
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#1e293b' }}>
                Add Slots for <span style={{ color: '#2563eb' }}>{activeDayTab}</span>:
              </span>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Start Time</span>
                  <input type="time" value={slotStartTime} onChange={(e) => setSlotStartTime(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'block' }} />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>End Time</span>
                  <input type="time" value={slotEndTime} onChange={(e) => setSlotEndTime(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'block' }} />
                </div>
                <button
                  type="button"
                  onClick={handleAddSlotToActiveDay}
                  style={{
                    marginTop: '16px',
                    padding: '8px 14px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                >
                  + Add Slot
                </button>
              </div>

              {/* Added Slots List for Selected Day */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(!availabilityMap[activeDayTab] || availabilityMap[activeDayTab].length === 0) ? (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>No slots configured for {activeDayTab}.</span>
                ) : (
                  availabilityMap[activeDayTab].map((slot) => (
                    <span
                      key={slot}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        border: '1px solid #bfdbfe'
                      }}
                    >
                      {slot}
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(activeDayTab, slot)}
                        style={{ background: 'transparent', border: 'none', color: '#1d4ed8', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} style={btnPrimary}>
            {submitting ? 'Saving...' : editingId ? 'Update Doctor' : 'Add Doctor'}
          </button>
        </form>
      </div>

      {/* Enlisted Doctors Table */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1e293b' }}>Enlisted Doctors</h3>

        {loadingList ? (
          <p style={{ color: '#64748b' }}>Loading doctor list...</p>
        ) : doctorsList.length === 0 ? (
          <p style={{ color: '#64748b' }}>No doctors found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '13px' }}>ID</th>
                  <th style={{ padding: '10px', textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '13px' }}>Name</th>
                  <th style={{ padding: '10px', textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '13px' }}>Specialty</th>
                  <th style={{ padding: '10px', textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '13px' }}>Contact</th>
                  <th style={{ padding: '10px', textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '13px' }}>Availability Summary</th>
                  <th style={{ padding: '10px', textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '13px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctorsList.map((doc) => {
                  let availSummary = 'Not configured';
                  try {
                    const parsed = doc.availability;
                    if (parsed && typeof parsed === 'object') {
                      const days = Object.keys(parsed);
                      availSummary = days.map((d) => `${d} (${parsed[d].length})`).join(', ');
                    }
                  } catch (e) {}

                  return (
                    <tr key={doc.id}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}><strong>{doc.id}</strong></td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>{doc.name}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>{doc.specialty}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                        <div>{doc.email}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{doc.phone}</div>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', fontSize: '12px', maxWidth: '200px' }}>
                        {availSummary || 'No slots configured'}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
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
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(doc)}
                            disabled={deletingId === doc.id}
                            style={{
                              padding: '4px 10px',
                              background: '#dc2626',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              opacity: deletingId === doc.id ? 0.6 : 1
                            }}
                          >
                            {deletingId === doc.id ? 'Removing...' : 'Remove'}
                          </button>
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
