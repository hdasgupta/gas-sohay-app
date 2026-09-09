import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Alert from './components/Alert';
import MeetLinkCard from './components/MeetLinkCard';
import LoginView from './views/LoginView';
import SignupView from './views/SignupView';
import BookingView from './views/BookingView';
import AdminView from './views/AdminView';
import AppointmentListView from './views/AppointmentListView';
import PrescriptionView from './views/PrescriptionView';

import { getSession, saveSession, clearSession } from './utils/storage';
import { callBackend } from './utils/backend';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'booking' | 'appointments' | 'admin' | 'confirmed'
  const [doctors, setDoctors] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const saved = getSession();
    if (saved) {
      setUser(saved);
      routeUserByRole(saved);
    }
  }, []);

  const routeUserByRole = (usr) => {
  if (usr.role === 'admin') {
    setView('admin');
  } else if (usr.role === 'doctor') {
    setView('prescription');
  } else {
    setView('booking');
  }
  loadDoctors();
};

  const loadDoctors = () => {
    callBackend('getDoctorsList', [], (data) => setDoctors(data || []));
  };
  
  const handleSignUp = (formData) => {
  setStatus('Registering user...');
  callBackend('registerPatient', [formData], (res) => {
    if (res.success) {
      setUser(res.user);
      saveSession(res.user);
      setStatus('');
      setView('booking');
      loadDoctors();
    } else {
      setStatus(res.message);
    }
  });
};

  const handleLogin = ({ email, password }) => {
    setStatus('Authenticating...');
    callBackend('authenticateUser', [email, password], (res) => {
      if (res.success) {
        setUser(res.user);
        saveSession(res.user);
        setStatus('');
        routeUserByRole(res.user);
      } else {
        setStatus(res.message);
      }
    });
  };
  
  setInterval(function() {
    callBackend('pingServer', []);
  }, 10 * 60 * 1000);

  const handleBookAppointment = (payload) => {
    setStatus('Creating Google Calendar Event & Meet Link...');
    callBackend('bookAppointment', [payload], (res) => {
      if (res.success) {
        setConfirmation(res);
        setStatus('');
        setView('confirmed');
      }
    });
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setView('login');
  };

  return (
   
    <div style={styles.container}>
      <Header user={user} onLogout={handleLogout} styles={styles} />
      
      {/* Navigation Bar for Logged-In Users */}
      {user && user.role !== 'admin' && (
        <div style={styles.navBar}>
          {user.role === 'patient' && <button style={view === 'booking' ? styles.navActive : styles.navBtn} onClick={() => setView('booking')}>
            Book Appointment
          </button>
          <button onClick={() => setCurrentTab('family')} style={{ padding: '8px 12px', cursor: 'pointer', fontWeight: currentTab === 'family' ? 'bold' : 'normal' }}>
          Family Account
        </button>}
          <button style={view === 'appointments' ? styles.navActive : styles.navBtn} onClick={() => setView('appointments')}>
            My Appointments
          </button>
          {user.role==='doctor' && <button
            style={view === 'prescription' ? styles.navActive : styles.navBtn}
            onClick={() => setView('prescription')}
          >
            Prescription
          </button>}
        </div>
      )}

      <Alert message={status} styles={styles} />

      {view === 'login' && <LoginView onSubmit={handleLogin} onNavigateSignup={() => setView('signup')} styles={styles} />}
      {view === 'signup' && <SignupView onSubmit={(formData) => handleSignUp(formData)} onNavigateLogin={() => setView('login')} styles={styles} />}
      {view === 'booking' && <BookingView doctors={doctors} user={user} onSubmitBooking={handleBookAppointment} styles={styles} />}
      {view === 'appointments' && <AppointmentListView user={user} styles={styles} />}
      {view === 'prescription' &&  <PrescriptionView user={user} styles={styles} />}
      {currentTab === 'family' && <FamilyManagementView user={user} />}
      {view === 'admin' && <AdminView doctors={doctors} onSaveDoctor={() => loadDoctors()} styles={styles} />}
      {view === 'confirmed' && confirmation && (
        <MeetLinkCard confirmation={confirmation} user={user} onReset={() => setView('appointments')} styles={styles} />
      )}
    </div>
    
  );
}

const styles = {
  container: { maxWidth: '480px', margin: '30px auto', fontFamily: 'Arial, sans-serif' },
  card: { padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' },
  btnPrimary: { width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  btnSecondary: { padding: '5px 10px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  btnDanger: { background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
  label: { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  navBar: { display: 'flex', gap: '8px', marginBottom: '16px' },
  navBtn: { flex: 1, padding: '8px', background: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' },
  navActive: { flex: 1, padding: '8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  link: { color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' },
  alert: { padding: '10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', marginBottom: '12px', fontSize: '14px' },
  apptCard: { border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px', marginBottom: '12px', background: '#fafafa' },
  apptHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  badgeActive: { background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  badgeExpired: { background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  meetBtn: { display: 'inline-block', background: '#16a34a', color: '#fff', padding: '8px 12px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' },
  expiredNotice: { fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginTop: '6px' }
};
