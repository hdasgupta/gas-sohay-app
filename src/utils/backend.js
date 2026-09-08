export const callBackend = (fn, args = [], cb) => {
  if (typeof google !== 'undefined' && google.script) {
    google.script.run
    .withFailureHandler((e) => alert(JSON.stringify(e))) 
    .withSuccessHandler(cb)[fn](...args);
  } else {
    // Development Local Mocking
    setTimeout(() => {
      if (fn === 'getDoctorsList') {
        cb([
          {
            id: 'DOC-1',
            name: 'Dr. Smith',
            specialty: 'Cardiology',
            email: 'smith@doc.com',
            phone: '123',
            availability: ['09:00', '11:00']
          }
        ]);
      }
      if (fn === 'upsertDoctor') cb({ success: true, message: 'Saved successfully (Mock)' });
      if (fn === 'bookAppointment') cb({ success: true, bookingId: 'APT-999', meetLink: 'https://meet.google.com/xyz-abc-def' });
      if (fn === 'authenticateUser') cb({ success: true, user: { id: '1', name: 'Test User', role: 'patient', email: args[0] } });
      if (fn === 'registerPatient') cb({ success: true, user: { id: '2', name: args[0].name, role: 'patient', email: args[0].email } });
    }, 500);
  }
};
