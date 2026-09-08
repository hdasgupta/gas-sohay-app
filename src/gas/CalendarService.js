/**
 * Schedules a Google Calendar Event with Meet link & notifies patient.
 */
function bookAppointment(payload) {
  var startDateTime = new Date(
    JSON.parse(payload.date) + 'T' + 
    JSON.parse(payload.time));
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

/**
 * Fetches all appointments for a user and includes the Meet link only for active/future sessions.
 */
function getUserAppointments(userEmail) {
  initDatabase();
  var sheet = getOrCreateSheet('Appointments');
  var data = sheet.getDataRange().getValues();
  var appointments = [];
  var now = new Date();

  console.log(JSON.stringify(data), data[1][1], data[1][2], userEmail)
  for (var i = 1; i < data.length; i++) {
    var patientEmail = data[i][1];
    var doctorEmail = data[i][2];

    if (patientEmail === userEmail || doctorEmail === userEmail) {
      var dateStr = JSON.parse(data[i][3]); // Format: YYYY-MM-DD
      var timeStr = JSON.parse(data[i][4]); // Format: HH:MM
      var rawMeetLink = data[i][5];
      var status = data[i][6];

      // Parse appointment end time (assuming 30-minute duration)
      var apptStartTime = new Date(dateStr + 'T' + timeStr);
      var apptEndTime = new Date(apptStartTime.getTime() + 30 * 60000);

      // Present/Future criteria: Meeting end time has not passed yet
      var isUpcomingOrPresent = now <= apptEndTime;
      

      appointments.push({
        id: data[i][0],
        patient: getPatientByEmail (patientEmail).name,
        doctor: getDoctorByEmail(doctorEmail).name,
        date: dateStr,
        time: timeStr,
        meetLink: isUpcomingOrPresent ? rawMeetLink : null,
        status: isUpcomingOrPresent ? 'UPCOMING' : 'COMPLETED',
        isUpcomingOrPresent: isUpcomingOrPresent
      });
    }
  }
  
  console.log(JSON.stringify(appointments)) ;

  // Sort: Upcoming meetings first, then by date descending
  return appointments.sort(function(a, b) {
    return new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time);
  });
}
