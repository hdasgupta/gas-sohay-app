import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';
import MessageBox from '../components/MessageBox';

export default function FamilyManagementView({ user = {}, styles = {} }) {
  const cardStyle = styles.card || { padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' };
  const inputStyle = styles.input || { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
  const btnStyle = styles.btnPrimary || { padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

  const [alert, setAlert] = useState(null);
  const [familyData, setFamilyData] = useState(null);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const showAlert = (message, type = 'info', duration = 5000) => {
    setAlert({ message, type, duration });
  };

  const fetchFamily = () => {
    setLoading(true);
    callBackend('getFamilyDetailsByUser', [user.email], (data) => {
      setFamilyData(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchFamily();
  }, [user.email]);

  const handleCreateFamily = () => {
    if (!newFamilyName.trim()) return showAlert('Please enter a family name.', 'warning');
    setErrorMsg('');
    callBackend('createFamily', [{ familyName: newFamilyName, userEmail: user.email }], (res) => {
      if (res && res.success) {
        fetchFamily();
      } else {
        setErrorMsg(res?.error || 'Failed to create family.');
      }
    });
  };

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) return showAlert('Please enter member email.', 'warning');
    setErrorMsg('');
    callBackend('addFamilyMember', [{ familyId: familyData.familyId, memberEmail: newMemberEmail.trim() }], (res) => {
      if (res && res.success) {
        setNewMemberEmail('');
        fetchFamily();
      } else {
        setErrorMsg(res?.error || 'Failed to add member.');
      }
    });
  };

  if (loading) return <div style={cardStyle}>Loading family details...</div>;

  return (
    <div style={cardStyle}>
      <h2>Family Account Settings</h2>

      {errorMsg && (
        <div style={{ padding: '10px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '12px' }}>
          {errorMsg}
        </div>
      )}
      
      {alert && (
        <MessageBox
          message={alert.message}
          type={alert.type}
          duration={alert.duration}
          onClose={() => setAlert(null)}
        />
      )}
      
      {!familyData ? (
        <div>
          <p>You are not enrolled in any family group yet. Create one to manage members and book appointments for them.</p>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Family Name</label>
          <input
            style={inputStyle}
            placeholder="e.g. Dasgupta Family"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
          />
          <button style={btnStyle} onClick={handleCreateFamily}>Create Family Group</button>
        </div>
      ) : (
        <div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>{familyData.familyName}</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Family ID: <strong>{familyData.familyId}</strong></span>
          </div>

          <h4>Family Members ({familyData.members?.length || 0})</h4>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
            {familyData.members?.map((member, idx) => (
              <div key={idx} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{member.name}</strong> 
                  <div style={{ fontSize: '12px', color: '#475569' }}>{member.email}</div>
                </div>
                {member.email === user.email && (
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>You</span>
                )}
              </div>
            ))}
          </div>

          <hr style={{ margin: '16px 0', border: '0', borderTop: '1px solid #e2e8f0' }} />

          <h4>Add Family Member</h4>
          <p style={{ fontSize: '12px', color: '#64748b' }}>Note: The patient must already be registered in the system and cannot belong to another family.</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={{ ...inputStyle, marginBottom: 0 }}
              placeholder="Registered patient email..."
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
            />
            <button style={{ ...btnStyle, whiteSpace: 'nowrap' }} onClick={handleAddMember}>Add Member</button>
          </div>
        </div>
      )}
    </div>
  );
}
