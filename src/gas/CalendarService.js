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
 * Retrieves appointments and member information.
 * If the user belongs to a family, fetches appointments for all enrolled family members.
 * If the user is an individual patient, retrieves only their personal appointments.
 */
function getAppointmentsForUserAndFamily(userEmail) {
  if (!userEmail) return { familyInfo: null, appointments: [] };

  const familyData = getFamilyDetailsByUser(userEmail);
  const memberMap = {};
  const emailsToFetch = [];

  if (familyData && familyData.members && familyData.members.length > 0) {
    familyData.members.forEach((m) => {
      const lowerEmail = m.email.toLowerCase();
      emailsToFetch.push(lowerEmail);
      memberMap[lowerEmail] = m;
    });
  } else {
    // Individual patient (not in a family)
    const patientSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    let patientName = userEmail;

    if (patientSheet) {
      const pData = patientSheet.getDataRange().getValues();
      for (let i = 1; i < pData.length; i++) {
        if (pData[i][3] && pData[i][3].toString().toLowerCase() === userEmail.toLowerCase()) {
          patientName = pData[i][1];
          
          break;
        }
      }
    }

    const lowerEmail = userEmail.toLowerCase();
    emailsToFetch.push(lowerEmail);
    memberMap[lowerEmail] = { name: patientName, email: userEmail };
  }

  const apptSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  if (!apptSheet) return { familyInfo: familyData || null, appointments: [] };

  const apptData = apptSheet.getDataRange().getValues();
  const appointments = [];

  // Sheet structure: [0: ApptID, 1: PatientName, 2: PatientEmail, 3: Date, 4: Time, 5: Status, 6: PrescriptionUrl]
  for (let i = 1; i < apptData.length; i++) {
    const rowPatientEmail = apptData[i][1] ? apptData[i][1].toString().toLowerCase() : '';
    const rowDoctorEmail = apptData[i][2] ? apptData[i][2].toString().toLowerCase() : '';
    if (emailsToFetch.includes(rowPatientEmail)) {
      const memberInfo = memberMap[rowPatientEmail];
      appointments.push({
        id: apptData[i][0],
        patient: getPatientByEmail(rowPatientEmail),
        doctor: getDoctorByEmail(rowDoctorEmail),
        date: apptData[i][3],
        time: apptData[i][4],
        status: apptData[i][6] || 'Scheduled',
        prescriptionUrl: apptData[i][7] || ''
      });
    }
  }

  return {
    familyInfo: familyData || null,
    appointments: appointments
  };
}

