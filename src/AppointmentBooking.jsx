import React, { useState } from 'react';

const DOCTORS = [
  { id: '1', name: 'Dr. Sarah Smith', specialty: 'Cardiology' },
  { id: '2', name: 'Dr. John Doe', specialty: 'Dermatology' },
  { id: '3', name: 'Dr. Priya Patel', specialty: 'General Medicine' }
];

const TIME_SLOTS = ['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM'];

export default function AppointmentApp() {
  const [step, setStep] = useState('booking'); // 'booking' | 'payment'
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    doctorId: '',
    date: '',
    timeSlot: ''
  });
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Apps Script API Call or Local Fallback
    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler((res) => {
          setBookingId(res.bookingId);
          setStep('payment');
          setLoading(false);
        })
        .saveAppointment(formData);
    } else {
      setTimeout(() => {
        setBookingId(`APT-${Date.now().toString().slice(-6)}`);
        setStep('payment');
        setLoading(false);
      }, 800);
    }
  };

  // Target Webhook/Callback URL embedded into QR Code
  const callbackUrl = `https://your-app-domain.com/api/payment-callback?bookingId=${bookingId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(callbackUrl)}`;

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', fontFamily: 'sans-serif' }}>
      {step === 'booking' ? (
        <form onSubmit={handleSubmit}>
          <h2 style={{ marginBottom: '20px' }}>Book Appointment</h2>

          <label style={{ display: 'block', marginBottom: '4px' }}>Full Name</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} />

          <label style={{ display: 'block', marginBottom: '4px' }}>Location</label>
          <input required type="text" name="location" value={formData.location} onChange={handleChange} style={inputStyle} />

          <label style={{ display: 'block', marginBottom: '4px' }}>Phone Number</label>
          <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} />

          <label style={{ display: 'block', marginBottom: '4px' }}>Doctor</label>
          <select required name="doctorId" value={formData.doctorId} onChange={handleChange} style={inputStyle}>
            <option value="">Select Doctor</option>
            {DOCTORS.map((doc) => (
              <option key={doc.id} value={doc.name}>{doc.name} - {doc.specialty}</option>
            ))}
          </select>

          <label style={{ display: 'block', marginBottom: '4px' }}>Appointment Date</label>
          <input required type="date" name="date" value={formData.date} onChange={handleChange} style={inputStyle} />

          <label style={{ display: 'block', marginBottom: '4px' }}>Time Slot</label>
          <select required name="timeSlot" value={formData.timeSlot} onChange={handleChange} style={inputStyle}>
            <option value="">Select Time Slot</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h2>Merchant Payment</h2>
          <p style={{ color: '#4a5568' }}>Booking ID: <strong>{bookingId}</strong></p>
          <p style={{ fontSize: '14px', color: '#718096' }}>Scan QR Code with your payment app to finalize booking.</p>

          <div style={{ margin: '20px 0' }}>
            <img src={qrCodeUrl} alt="Merchant Payment QR Code" style={{ border: '1px solid #cbd5e0', padding: '8px', borderRadius: '8px' }} />
          </div>

          <div style={{ wordBreak: 'break-all', fontSize: '12px', color: '#a0aec0', padding: '8px', background: '#f7fafc', borderRadius: '4px' }}>
            <strong>Callback Endpoint:</strong> {callbackUrl}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '8px 12px', marginBottom: '16px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
