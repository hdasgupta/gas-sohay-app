import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';

export default function PrescriptionView({ user = {}, styles = {} }) {
  const defaultStyles = {
    card: styles.card || { padding: '20px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', margin: '10px 0' },
    input: styles.input || { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' },
    readOnlyInput: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#475569', cursor: 'not-allowed', boxSizing: 'border-box' },
    label: styles.label || { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' },
    btnPrimary: styles.btnPrimary || { width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
    btnSecondary: styles.btnSecondary || { width: '100%', padding: '8px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    btnDanger: styles.btnDanger || { background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }
  };

  const fixedClinicInfo = {
    orgName: user?.orgName || 'WEST BENGAL FORUM FOR MENTAL HEALTH',
    doctorName: user?.name || 'Dr. A. Sharma',
    doctorEmail: user?.email || 'dr.sharma@example.com',
    doctorSpeciality: user?.speciality || user?.designation || 'MBBS, MD (Psychiatry)'
  };

  const todayDate = new Date().toISOString().split('T')[0];

  const [masterMedicines, setMasterMedicines] = useState([]);
  const [masterPatients, setMasterPatients] = useState([]);
  const [isMedicinesLoading, setIsMedicinesLoading] = useState(true);

  // Patient Fields
  const [patientInput, setPatientInput] = useState('');
  const [patientEmail, setPatientEmail] = useState(''); // Stored silently in background
  const [patientAge, setPatientAge] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [docLink, setDocLink] = useState('');
  const [loading, setLoading] = useState(false);

  const initialMedState = {
    name: '',
    quantity: '',
    isSos: false,
    takingTime: { breakfast: false, lunch: false, hightea: false, dinner: false },
    foodInstruction: 'After Food'
  };

  const [currentMed, setCurrentMed] = useState(initialMedState);
  const [prescriptionList, setPrescriptionList] = useState([]);

  useEffect(() => {
    let medDone = false;
    let patientDone = false;

    const checkLoadingFinished = () => {
      if (medDone && patientDone) setIsMedicinesLoading(false);
    };

    try {
      callBackend('getMedicineMasterList', [], (data) => {
        setMasterMedicines(Array.isArray(data) ? data : []);
        medDone = true;
        checkLoadingFinished();
      });
    } catch (err) {
      medDone = true;
      checkLoadingFinished();
    }

    try {
      callBackend('getTodayPatientsForDoctor', [use.email], (data) => {
        setMasterPatients(Array.isArray(data) ? data : []);
        patientDone = true;
        checkLoadingFinished();
      });
    } catch (err) {
      patientDone = true;
      checkLoadingFinished();
    }
  }, []);

  const resetForm = () => {
    setPatientInput('');
    setPatientEmail('');
    setPatientAge('');
    setShowPatientDropdown(false);
    setSearchTerm('');
    setPrescriptionList([]);
    setCurrentMed(initialMedState);
  };

  const filteredPatients = patientInput.trim().length >= 2
    ? masterPatients.filter((p) => {
        const pName = typeof p === 'string' ? p : p?.name || '';
        return pName.toLowerCase().includes(patientInput.trim().toLowerCase());
      })
    : [];

  const showMedicineSuggestions = searchTerm.trim().length >= 4;
  const filteredMedicines = showMedicineSuggestions
    ? masterMedicines.filter((m) => {
        const medName = typeof m === 'string' ? m : m?.name || '';
        return medName.toLowerCase().includes(searchTerm.trim().toLowerCase());
      })
    : [];

  // Patient Selection captures and stores email silently
  const handleSelectPatient = (patient) => {
    const pName = typeof patient === 'string' ? patient : patient?.name || '';
    const pEmail = typeof patient === 'object' && patient?.email ? patient.email : '';
    const pAge = typeof patient === 'object' && patient?.age ? patient.age : '';

    setPatientInput(pName);
    setPatientEmail(pEmail); // Store patient email internally
    if (pAge) setPatientAge(pAge);
    setShowPatientDropdown(false);
  };

  const handleMedicineNameChange = (name) => {
    const isTablet = name.trim().toLowerCase().endsWith('tablet');
    setCurrentMed((prev) => ({
      ...prev,
      name: name,
      quantity: isTablet ? '1 pcs' : (prev.quantity === '1 pcs' ? '' : prev.quantity)
    }));
  };

  const handleSelectSearchedMedicine = (med) => {
    const selectedName = typeof med === 'string' ? med : med?.name || '';
    handleMedicineNameChange(selectedName);
    setSearchTerm('');
  };

  const handleTimeCheckbox = (timeKey) => {
    setCurrentMed((prev) => ({
      ...prev,
      takingTime: {
        ...(prev.takingTime || {}),
        [timeKey]: !prev.takingTime?.[timeKey]
      }
    }));
  };

  const handleAddMedicine = () => {
    if (!currentMed.name.trim()) {
      alert('Please enter a medicine name.');
      return;
    }

    const selectedTimes = Object.keys(currentMed.takingTime || {})
      .filter((k) => currentMed.takingTime[k])
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1));

    if (!currentMed.isSos && selectedTimes.length === 0) {
      alert('Select at least one taking time or check SOS.');
      return;
    }

    setPrescriptionList((prev) => [
      ...prev,
      {
        name: currentMed.name.trim(),
        quantity: currentMed.quantity.trim() || '1 pcs',
        isSos: currentMed.isSos,
        takingTime: selectedTimes,
        foodInstruction: currentMed.foodInstruction
      }
    ]);

    setCurrentMed(initialMedState);
    setSearchTerm('');
  };

  const handleRemoveMedicine = (index) => {
    setPrescriptionList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleGenerateDoc = (overrideConfirmed = false) => {
    if (!patientInput.trim() || !patientAge) {
      alert('Please fill in Patient Name and Age.');
      return;
    }
    if (prescriptionList.length === 0) {
      alert('Please add at least one medicine.');
      return;
    }

    setLoading(true);

    const payload = {
      ...fixedClinicInfo,
      doctorDesignation: fixedClinicInfo.doctorSpeciality,
      patientName: patientInput.trim(),
      patientEmail: patientEmail.trim(), // Sent to backend seamlessly
      patientAge: patientAge,
      date: todayDate,
      medicines: prescriptionList,
      overrideConfirmed: overrideConfirmed
    };

    callBackend('createPrescriptionDoc', [payload], (res) => {
      setLoading(false);

      if (res && res.requiresConfirmation) {
        const confirmOverride = window.confirm(
          `A prescription is already attached to the appointment on ${res.appointmentDate} at ${res.appointmentTime}.\n\nDo you want to override it with this new prescription?`
        );

        if (confirmOverride) {
          handleGenerateDoc(true);
        }
        return;
      }

      if (res && res.success) {
        setDocLink(res.docUrl);
        resetForm();
      } else {
        alert('Failed to generate prescription document: ' + (res?.error || 'Unknown error'));
      }
    });
  };

  return (
    <div style={defaultStyles.card}>
      <h2>Prepare Digital Prescription</h2>

      <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
        <div>
          <label style={defaultStyles.label}>Organization Name (Locked)</label>
          <input style={defaultStyles.readOnlyInput} value={fixedClinicInfo.orgName} readOnly />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={defaultStyles.label}>Doctor Name & Email (Locked)</label>
            <input style={defaultStyles.readOnlyInput} value={`${fixedClinicInfo.doctorName} (${fixedClinicInfo.doctorEmail})`} readOnly />
          </div>
          <div style={{ flex: 1 }}>
            <label style={defaultStyles.label}>Speciality (Locked)</label>
            <input style={defaultStyles.readOnlyInput} value={fixedClinicInfo.doctorSpeciality} readOnly />
          </div>
        </div>

        {/* Patient Selection Row */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 3, position: 'relative' }}>
            <label style={defaultStyles.label}>Patient Name</label>
            <input
              style={defaultStyles.input}
              placeholder="Type or select patient name..."
              value={patientInput}
              onChange={(e) => {
                setPatientInput(e.target.value);
                setPatientEmail(''); // Clear hidden email if user types a new manual name
                setShowPatientDropdown(true);
              }}
              onFocus={() => setShowPatientDropdown(true)}
            />

            {showPatientDropdown && filteredPatients.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  zIndex: 20,
                  maxHeight: '140px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                {filteredPatients.map((patient, idx) => {
                  const name = typeof patient === 'string' ? patient : patient?.name || '';
                  const age = typeof patient === 'object' && patient?.age ? ` (${patient.age} yrs)` : '';
                  return (
                    <div
                      key={idx}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <strong>{name}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{age}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label style={defaultStyles.label}>Patient Age</label>
            <input
              style={defaultStyles.input}
              type="number"
              placeholder="Age"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={defaultStyles.label}>Date (Locked)</label>
            <input style={defaultStyles.readOnlyInput} type="date" value={todayDate} readOnly />
          </div>
        </div>
      </div>

      <hr style={{ margin: '16px 0', border: '0', borderTop: '1px solid #e2e8f0' }} />

      <h3>Add Medicine</h3>

      {isMedicinesLoading ? (
        <div style={{ padding: '12px', background: '#e0f2fe', borderRadius: '6px', color: '#0369a1', marginBottom: '16px', fontSize: '14px' }}>
          ⏳ Loading catalog data...
        </div>
      ) : (
        <div style={{ marginBottom: '12px', position: 'relative' }}>
          <input
            style={defaultStyles.input}
            placeholder="Search medicine catalog (type at least 4 letters)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {showMedicineSuggestions && filteredMedicines.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', zIndex: 10, maxHeight: '150px', overflowY: 'auto' }}>
              {filteredMedicines.map((med, idx) => {
                const medName = typeof med === 'string' ? med : med?.name || '';
                return (
                  <div key={idx} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} onClick={() => handleSelectSearchedMedicine(med)}>
                    <strong>{medName}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 2 }}>
            <label style={defaultStyles.label}>Medicine Name:</label>
            <input style={defaultStyles.input} placeholder="e.g. Paracetamol Tablet" value={currentMed.name} onChange={(e) => handleMedicineNameChange(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={defaultStyles.label}>Quantity / Dose:</label>
            <input style={defaultStyles.input} placeholder="e.g. 1 pcs" value={currentMed.quantity} onChange={(e) => setCurrentMed({ ...currentMed, quantity: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <label style={defaultStyles.label}>Taking Time:</label>
            <div style={{ display: 'flex', gap: '10px', fontSize: '13px', margin: '4px 0' }}>
              {['breakfast', 'lunch', 'hightea', 'dinner'].map((time) => (
                <label key={time} style={{ textTransform: 'capitalize' }}>
                  <input type="checkbox" checked={currentMed.takingTime?.[time] || false} onChange={() => handleTimeCheckbox(time)} /> {time}
                </label>
              ))}
            </div>
          </div>

          <div style={{ background: '#fef3c7', padding: '6px 12px', borderRadius: '4px', border: '1px solid #fde68a' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#92400e' }}>
              <input type="checkbox" checked={currentMed.isSos} onChange={(e) => setCurrentMed({ ...currentMed, isSos: e.target.checked })} />
              SOS (As Needed)
            </label>
          </div>
        </div>

        <div>
          <label style={defaultStyles.label}>Food Instruction:</label>
          <select style={defaultStyles.input} value={currentMed.foodInstruction} onChange={(e) => setCurrentMed({ ...currentMed, foodInstruction: e.target.value })}>
            <option value="Before Food">Before Food</option>
            <option value="After Food">After Food</option>
            <option value="With Food">With Food</option>
          </select>
        </div>

        <button type="button" onClick={handleAddMedicine} style={defaultStyles.btnSecondary}>
          + Add Medicine to List
        </button>
      </div>

      <h3 style={{ marginTop: '16px' }}>Prescription Items ({prescriptionList.length})</h3>
      {prescriptionList.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '8px 12px', borderRadius: '4px', marginBottom: '6px' }}>
          <div>
            <strong>{idx + 1}. {item.name}</strong> — <em>{item.quantity}</em>
            {item.isSos && <span style={{ marginLeft: '8px', background: '#fef08a', color: '#854d0e', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>SOS</span>}
            <div style={{ fontSize: '12px', color: '#475569' }}>Times: {item.takingTime.length > 0 ? item.takingTime.join(', ') : 'As needed'} | ({item.foodInstruction})</div>
          </div>
          <button style={defaultStyles.btnDanger} onClick={() => handleRemoveMedicine(idx)}>Remove</button>
        </div>
      ))}

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => handleGenerateDoc(false)}
          disabled={loading || isMedicinesLoading}
          style={{ ...defaultStyles.btnPrimary, background: (loading || isMedicinesLoading) ? '#94a3b8' : '#2563eb' }}
        >
          {loading ? 'Generating Google Doc...' : 'Generate Google Doc Prescription'}
        </button>

        {docLink && (
          <div style={{ marginTop: '12px', padding: '10px', background: '#dcfce7', borderRadius: '4px' }}>
            <strong>Prescription Created & Attached to Appointment!</strong>
            <br />
            <a href={docLink} target="_blank" rel="noopener noreferrer" style={{ color: '#15803d', fontWeight: 'bold' }}>
              Download rescription ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
