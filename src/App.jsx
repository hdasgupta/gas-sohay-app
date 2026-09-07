import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Alert from './components/Alert';
import MeetLinkCard from './components/MeetLinkCard';
import LoginView from './views/LoginView';
import SignupView from './views/SignupView';
import BookingView from './views/BookingView';
import AdminView from './views/AdminView';

import { getSession, saveSession, clearSession } from './utils/storage';
import { callBackend } from './utils/backend';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
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
    setView(usr.role === 'admin' ? 'admin' : 'booking');
    loadDoctors();
  };

  const loadDoctors = () => {
    callBackend('getDoctorsList', [], (data) => setDoctors(data || []));
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

  const handleSaveDoctor = (docForm, resetForm) => {
    setStatus('Saving Doctor Data...');
    const payload = {
      ...docForm,
      availability: docForm.availability.split(',').map((s) => s.trim())
    };
    callBackend('upsertDoctor', [payload], (res) => {
      setStatus(res.message);
      loadDoctors();
      resetForm();
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
      <Alert message={status} styles={styles} />

      {view === 'login' && <LoginView onSubmit={handleLogin} onNavigateSignup={() => setView('signup')} styles={styles} />}
      {view === 'signup' && <SignupView onSubmit={handleSignUp} onNavigateLogin={() => setView('login')} styles={styles} />}
      {view === 'booking' && <BookingView doctors={doctors} user={user} onSubmitBooking={handleBookAppointment} styles={styles} />}
      {view === 'admin' && <AdminView doctors={doctors} onSaveDoctor={handleSaveDoctor} styles={styles} />}
      {view === 'confirmed' && confirmation && (
        <MeetLinkCard confirmation={confirmation} user={user} onReset={() => setView(user.role === 'admin' ? 'admin' : 'booking')} styles={styles} />
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
  link: { color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' },
  alert: { padding: '10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', marginBottom: '12px', fontSize: '14px' },
  docItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '8px 0' },
  meetBox: { background: '#f8fafc', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '6px', margin: '15px 0', textAlign: 'center' },
  meetBtn: { display: 'inline-block', background: '#16a34a', color: '#fff', padding: '10px 16px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }
};
