/**
 * Schedules a Google Calendar Event with Meet link & notifies patient.
 */
function bookAppointment(payload) {
  var startDateTime = new Date(payload.date + 'T' + payload.time);
  var endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 mins

  // Advanced Calendar Service Google Meet Integration
  var eventPayload = {
    summary: 'Medical Appointment: ' + payload.doctorName,
    description: 'Patient: ' + payload.userName + '\nPhone: ' + payload.userPhone,
    start: { dateTime: startDateTime.toISOString() },
    end: { dateTime: endDateTime.toISOString() },
    attendees: [{ email: payload.userEmail }, { email: payload.doctorEmail }],
    conferenceData: {
      createRequest: {
        requestId: 'req-' + new Date().getTime(),
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  var calendarEvent = Calendar.Events.insert(eventPayload, 'primary', { conferenceDataVersion: 1 });
  var meetLink = calendarEvent.hangoutLink;

  // Save Booking Record
  var sheet = getOrCreateSheet('Appointments');
  var bookingId = 'APT-' + new Date().getTime();
  sheet.appendRow([bookingId, payload.userEmail, payload.doctorEmail, payload.date, payload.time, meetLink, 'CONFIRMED']);

  // Dispatch Confirmation Email
  sendAppointmentEmail(payload, meetLink);

  return { success: true, bookingId: bookingId, meetLink: meetLink };
}

function sendAppointmentEmail(payload, meetLink) {
  MailApp.sendEmail({
    to: payload.userEmail,
    subject: 'Appointment Confirmed - Google Meet Link Inside',
    htmlBody: `
      <h2>Appointment Confirmed</h2>
      <p><b>Doctor:</b> ${payload.doctorName}</p>
      <p><b>Date & Time:</b> ${payload.date} at ${payload.time}</p>
      <p><b>Google Meet Link:</b> <a href="${meetLink}">${meetLink}</a></p>
    `
  });
}
