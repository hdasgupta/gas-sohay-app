import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';

export default function PrescriptionView({ user = {}, styles = {} }) {
  // Safe Fallback Styles (Prevents blank screen if styles prop is undefined)
  const defaultStyles = {
    card: styles.card || { padding: '20px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', margin: '10px 0' },
    input: styles.input || { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' },
    label: styles.label || { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' },
    btnPrimary: styles.btnPrimary || { width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
    btnSecondary: styles.btnSecondary || { width: '100%', padding: '8px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    btnDanger: styles.btnDanger || { background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }
  };

  const [masterMedicines, setMasterMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [docLink, setDocLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [headerInfo, setHeaderInfo] = useState({
    orgName: 'CITY HEALTHCARE CLINIC',
    doctorName: user?.name || 'Dr. Doctor',
    doctorDesignation: 'MBBS, MD',
    patientName: '',
    patientAge: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [currentMed, setCurrentMed] = useState({
    name: '',
    power: '',
    takingTime: { breakfast: false, lunch: false, hightea: false, dinner: false },
    foodInstruction: 'After Food'
  });

  const [prescriptionList, setPrescriptionList] = useState([]);

  useEffect(() => {
    try {
      callBackend('getMedicineMasterList', [], (data) => {
        if (Array.isArray(data)) {
          setMasterMedicines(data);
        } else {
          setMasterMedicines([]);
        }
      });
    } catch (err) {
      console.error('Failed to load medicine list:', err);
      setMasterMedicines([]);
    }
  }, []);

  // Safe search filter
  const filteredMaster = (masterMedicines || []).filter((m) =>
    m && m.name ? m.name.toLowerCase().includes((searchTerm || '').toLowerCase()) : false
  );

  const handleSelectSearchedMedicine = (med) => {
    setCurrentMed((prev) => ({
      ...prev,
      name: med?.name || '',
      power: med?.power || ''
    }));
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
    if (!currentMed.name || !currentMed.power) {
      alert('Please provide medicine name and power.');
      return;
    }

    const selectedTimes = Object.keys(currentMed.takingTime || {})
      .filter((k) => currentMed.takingTime[k])
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1));

    if (selectedTimes.length === 0) {
      alert('Select at least one taking time.');
      return;
    }

    setPrescriptionList((prev) => [
      ...prev,
      {
        name: currentMed.name,
        power: currentMed.power,
        takingTime: selectedTimes,
        foodInstruction: currentMed.foodInstruction
      }
    ]);

    setCurrentMed({
      name: '',
      power: '',
      takingTime: { breakfast: false, lunch: false, hightea: false, dinner: false },
      foodInstruction: 'After Food'
    });
  };

  const handleRemoveMedicine = (index) => {
    setPrescriptionList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleGenerateDoc = () => {
    if (!headerInfo.patientName || !headerInfo.patientAge) {
      alert('Please fill in Patient Name and Age.');
      return;
    }
    if (prescriptionList.length === 0) {
      alert('Please add at least one medicine.');
      return;
    }

    setLoading(true);
    callBackend('createPrescriptionDoc', [{ ...headerInfo, medicines: prescriptionList }], (res) => {
      setLoading(false);
      if (res && res.success) {
        setDocLink(res.docUrl);
      } else {
        alert('Failed to generate prescription document.');
      }
    });
  };

  if (hasError) {
    return <div style={defaultStyles.card}>An error occurred while loading the prescription module. Please refresh.</div>;
  }

  return (
    <div style={defaultStyles.card}>
      <h2>Prepare Digital Prescription</h2>

      {/* Header & Patient Details */}
      <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
        <input style={defaultStyles.input} placeholder="Organization Name" value={headerInfo.orgName} onChange={(e) => setHeaderInfo({ ...headerInfo, orgName: e.target.value })} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input style={defaultStyles.input} placeholder="Doctor Name" value={headerInfo.doctorName} onChange={(e) => setHeaderInfo({ ...headerInfo, doctorName: e.target.value })} />
          <input style={defaultStyles.input} placeholder="Designation" value={headerInfo.doctorDesignation} onChange={(e) => setHeaderInfo({ ...headerInfo, doctorDesignation: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input style={defaultStyles.input} placeholder="Patient Name" value={headerInfo.patientName} onChange={(e) => setHeaderInfo({ ...headerInfo, patientName: e.target.value })} />
          <input style={defaultStyles.input} type="number" placeholder="Patient Age" value={headerInfo.patientAge} onChange={(e) => setHeaderInfo({ ...headerInfo, patientAge: e.target.value })} />
          <input style={defaultStyles.input} type="date" value={headerInfo.date} onChange={(e) => setHeaderInfo({ ...headerInfo, date: e.target.value })} />
        </div>
      </div>

      <hr style={{ margin: '16px 0', border: '0', borderTop: '1px solid #e2e8f0' }} />

      {/* Search Bar */}
      <h3>Add Medicine</h3>
      {masterMedicines.length > 0 ? (
        <div style={{ marginBottom: '12px', position: 'relative' }}>
          <input
            style={defaultStyles.input}
            placeholder="Search existing medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && filteredMaster.length > 0 && (
            <div style={{ position: 'absolute', background: '#fff', border: '1px solid #ccc', width: '100%', zIndex: 10, maxHeight: '120px', overflowY: 'auto' }}>
              {filteredMaster.map((med, idx) => (
                <div
                  key={idx}
                  style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                  onClick={() => handleSelectSearchedMedicine(med)}
                >
                  <strong>{med.name}</strong> ({med.power})
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
          No catalog medicines saved yet. Type medicine details below to create your first prescription.
        </p>
      )}

      {/* Manual Input */}
      <div style={{ display: 'grid', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            style={defaultStyles.input}
            placeholder="Medicine Name (e.g. Paracetamol)"
            value={currentMed.name}
            onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })}
          />
          <input
            style={defaultStyles.input}
            placeholder="Power/Dosage (e.g. 500mg)"
            value={currentMed.power}
            onChange={(e) => setCurrentMed({ ...currentMed, power: e.target.value })}
          />
        </div>

        <div>
          <label style={defaultStyles.label}>Taking Time:</label>
          <div style={{ display: 'flex', gap: '10px', fontSize: '13px', margin: '4px 0' }}>
            {['breakfast', 'lunch', 'hightea', 'dinner'].map((time) => (
              <label key={time} style={{ textTransform: 'capitalize' }}>
                <input
                  type="checkbox"
                  checked={currentMed.takingTime?.[time] || false}
                  onChange={() => handleTimeCheckbox(time)}
                />{' '}
                {time}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label style={defaultStyles.label}>Food Timing:</label>
          <select
            style={defaultStyles.input}
            value={currentMed.foodInstruction}
            onChange={(e) => setCurrentMed({ ...currentMed, foodInstruction: e.target.value })}
          >
            <option value="Before Food">Before Food</option>
            <option value="After Food">After Food</option>
            <option value="With Food">With Food</option>
          </select>
        </div>

        <button type="button" onClick={handleAddMedicine} style={defaultStyles.btnSecondary}>
          + Add Medicine to List
        </button>
      </div>

      {/* Selected List */}
      <h3 style={{ marginTop: '16px' }}>Prescription Items ({prescriptionList.length})</h3>
      {prescriptionList.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '8px 12px', borderRadius: '4px', marginBottom: '6px' }}>
          <div>
            <strong>{idx + 1}. {item.name}</strong> ({item.power})
            <div style={{ fontSize: '12px', color: '#475569' }}>
              Times: {item.takingTime.join(', ')} | ({item.foodInstruction})
            </div>
          </div>
          <button style={defaultStyles.btnDanger} onClick={() => handleRemoveMedicine(idx)}>Remove</button>
        </div>
      ))}

      {/* Generate Button */}
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={handleGenerateDoc}
          disabled={loading}
          style={{ ...defaultStyles.btnPrimary, background: loading ? '#94a3b8' : '#2563eb' }}
        >
          {loading ? 'Generating Google Doc...' : 'Generate Google Doc Prescription'}
        </button>

        {docLink && (
          <div style={{ marginTop: '12px', padding: '10px', background: '#dcfce7', borderRadius: '4px' }}>
            <strong>Prescription Created!</strong>
            <br />
            <a href={docLink} target="_blank" rel="noopener noreferrer" style={{ color: '#15803d', fontWeight: 'bold' }}>
              Open Google Doc Prescription ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
