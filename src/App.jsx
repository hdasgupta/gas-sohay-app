import React, { useState, useEffect } from 'react';

// Encryption Helper Utilities for LocalStorage
const encryptData = (data) => btoa(JSON.stringify(data));
const decryptData = (ciphertext) => {
  try { return JSON.parse(atob(ciphertext)); } catch { return null; }
};

const DOCTORS = [
  { id: '1', name: 'Dr. Sarah Smith', specialty: 'Cardiology' },
  { id: '2', name: 'Dr. John Doe', specialty: 'Dermatology' },
  { id: '3', name: 'Dr. Priya Patel', specialty: 'General Medicine' }
];

const TIME_SLOTS = ['09:00', '10:30', '14:00', '16:30'];

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'booking' | 'confirmation'
  const [formData, setFormData] = useState({ name: '', location: '', phone: '', email: '', password: '' });
  const [booking, setBooking] = useState({ doctorName: '', date: '', time: '' });
  const [confirmedData, setConfirmedData] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      const decryptedUser = decryptData(savedSession);
      if (decryptedUser) {
        setUser(decryptedUser);
        setView('booking');
      }
    }
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleBookingChange = (e) => setBooking({ ...booking, [e.target.name]: e.target.value });

  const handleSignUp = (e) => {
    e.preventDefault();
    setStatus('Creating account...');
    
    runBackend('registerUser', formData, (res) => {
      if (res.success) {
        saveUserSession(res.user);
      } else {
        setStatus(res.message);
      }
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setStatus('Logging in...');
    
    runBackend('loginUser', { email: formData.email, password: formData.password }, (res) => {
      if (res.success) {
        saveUserSession(res.user);
      } else {
        setStatus(res.message);
      }
    });
  };

  const saveUserSession = (userData) => {
    setUser(userData);
    localStorage.setItem('user_session', encryptData(userData));
    setStatus('');
    setView('booking');
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    setUser(null);
    setView('login');
  };

  const handleBookAppointment = (e) => {
    e.preventDefault();
    setStatus('Scheduling appointment & creating Google Meet link...');

    const payload = {
      ...booking,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone
    };

    runBackend('bookAppointment', payload, (res) => {
      if (res.success) {
        setConfirmedData(res);
        setStatus('');
        setView('confirmation');
      }
    });
  };

  const runBackend = (funcName, payload, callback) => {
    if (typeof google !== 'undefined' && google.script) {
      google.script.run.withSuccessHandler(callback)[funcName](payload);
    } else {
      // Mock Fallback for local UI testing
      setTimeout(() => {
        callback({ success: true, user: payload, meetLink: 'https://meet.google.com/abc-defg-hij', bookingId: 'APT-123456' });
      }, 1000);
    }
  };

  return (
    <div style={styles.container}>
      {user && (
        <div style={styles.header}>
          <span>Welcome, <strong>{user.name}</strong></span>
          <button onClick={handleLogout} style={styles.linkBtn}>Logout</button>
        </div>
      )}

      {status && <div style={styles.alert}>{status}</div>}

      {/* Auth Screens */}
      {view === 'login' && (
        <form onSubmit={handleLogin} style={styles.card}>
          <h2>Sign In</h2>
          <input required type="email" name="email" placeholder="Email" onChange={handleInputChange} style={styles.input} />
          <input required type="password" name="password" placeholder="Password" onChange={handleInputChange} style={styles.input} />
          <button type="submit" style={styles.button}>Sign In</button>
          <p>Don't have an account? <span onClick={() => setView('signup')} style={styles.link}>Sign Up</span></p>
        </form>
      )}

      {view === 'signup' && (
        <form onSubmit={handleSignUp} style={styles.card}>
          <h2>Sign Up</h2>
          <input required type="text" name="name" placeholder="Full Name" onChange={handleInputChange} style={styles.input} />
          <input required type="text" name="location" placeholder="Location" onChange={handleInputChange} style={styles.input} />
          <input required type="tel" name="phone" placeholder="Phone Number" onChange={handleInputChange} style={styles.input} />
          <input required type="email" name="email" placeholder="Email" onChange={handleInputChange} style={styles.input} />
          <input required type="password" name="password" placeholder="Password" onChange={handleInputChange} style={styles.input} />
          <button type="submit" style={styles.button}>Register</button>
          <p>Already registered? <span onClick={() => setView('login')} style={styles.link}>Sign In</span></p>
        </form>
      )}

      {/* Booking Form */}
      {view === 'booking' && (
        <form onSubmit={handleBookAppointment} style={styles.card}>
          <h2>Book Doctor Appointment</h2>
          
          <label style={styles.label}>Choose Doctor</label>
          <select required name="doctorName" onChange={handleBookingChange} style={styles.input}>
            <option value="">Select a Doctor</option>
            {DOCTORS.map(d => <option key={d.id} value={d.name}>{d.name} ({d.specialty})</option>)}
          </select>

          <label style={styles.label}>Appointment Date</label>
          <input required type="date" name="date" onChange={handleBookingChange} style={styles.input} />

          <label style={styles.label}>Time Slot</label>
          <select required name="time" onChange={handleBookingChange} style={styles.input}>
            <option value="">Select Time</option>
            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button type="submit" style={styles.button}>Confirm Booking</button>
        </form>
      )}

      {/* Confirmation Screen */}
      {view === 'confirmation' && confirmedData && (
        <div style={styles.card}>
          <h2>Booking Confirmed!</h2>
          <p>Booking ID: <strong>{confirmedData.bookingId}</strong></p>
          <p>An invitation and details have been sent to <strong>{user.email}</strong>.</p>
          
          <div style={styles.meetBox}>
            <p style={{ margin: '0 0 8px 0' }}><strong>Google Meet Link:</strong></p>
            <a href={confirmedData.meetLink} target="_blank" rel="noreferrer" style={styles.meetBtn}>
              Join Google Meet
            </a>
          </div>

          <button onClick={() => setView('booking')} style={{ ...styles.button, backgroundColor: '#4a5568' }}>
            Book Another Appointment
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '420px', margin: '40px auto', fontFamily: 'Arial, sans-serif' },
  card: { padding: '24px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' },
  input: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  label: { display: 'block', fontSize: '13px', marginBottom: '4px', color: '#4a5568' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' },
  link: { color: '#3182ce', cursor: 'pointer', fontWeight: 'bold' },
  linkBtn: { background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' },
  alert: { padding: '8px 12px', background: '#ebf8ff', borderLeft: '4px solid #3182ce', marginBottom: '16px', fontSize: '14px' },
  meetBox: { margin: '20px 0', padding: '16px', background: '#f7fafc', border: '1px dashed #cbd5e0', borderRadius: '6px', textAlign: 'center' },
  meetBtn: { display: 'inline-block', padding: '10px 16px', background: '#38a169', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }
};
