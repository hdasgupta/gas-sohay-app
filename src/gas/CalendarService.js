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
        meetLink: apptData[i][5],
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

/**
 * Returns a unique list of patients who have an appointment today with a specific doctor.
 * 
 * Expected Appointments Sheet Column Layout:
 * [0: ApptID, 1: PatientName, 2: PatientEmail, 3: Date, 4: Time, 5: Status, 6: PrescriptionUrl, 7: DoctorEmail]
 * 
 * @param {string} doctorEmail - Email of the doctor to query appointments for.
 * @return {Array<Object>} Array of unique patient records for today.
 */
function getTodayPatientsForDoctor(doctorEmail) {
  if (!doctorEmail) return [];

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Empty or header-only sheet

  // Format current date to 'YYYY-MM-DD' matching the sheet date format
  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const targetDoctor = doctorEmail.trim().toLowerCase();

  const uniquePatientsMap = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const patientEmail = row[1] ? row[1].toString().trim().toLowerCase() : '';
    const rawDate = row[3];
    const timeSlot = row[4] ? row[5].toString().trim() : '';
    const meetLink = row[5];
    const status = row[6] ? row[6].toString().trim() : 'Scheduled';
    const prescriptionUrl = row[7] || '';
    const rowDoctorEmail = row[2] ? row[7].toString().trim().toLowerCase() : '';

    // Convert Date object or string to standard 'YYYY-MM-DD'
    const apptDateStr = rawDate instanceof Date
      ? Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : rawDate ? rawDate.toString().trim() : '';

    // Matching criteria: Date is today, doctor matches (or empty row DoctorEmail fallback), valid patient email, not cancelled
    const isToday = apptDateStr === todayStr;
    const isDoctorMatch = !rowDoctorEmail || rowDoctorEmail === targetDoctor;
    const isValidStatus = status.toLowerCase() !== 'cancelled';

    if (isToday && isDoctorMatch && patientEmail && isValidStatus) {
      // Store or update in hash map to guarantee uniqueness per patient email
      if (!uniquePatientsMap[patientEmail]) {
        uniquePatientsMap[patientEmail] = {
          name: patientName,
          email: row[2], // Preserve original string case
          time: timeSlot,
          meetLink, 
          status: status,
          prescriptionUrl: prescriptionUrl,
          apptId: row[0]
        };
      }
    }
  }

  return Object.values(uniquePatientsMap);
}

/**
 * Returns time slots already booked for a specific doctor on a specific date.
 * Excludes cancelled appointments.
 */
function getBookedSlotsForDoctorAndDate(doctorEmail, dateStr) {
  if (!doctorEmail || !dateStr) return [];
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const bookedSlots = [];
  const targetDoctor = doctorEmail.toString().trim().toLowerCase();
  
  for (let i = 1; i < data.length; i++) {
    const rawDate = data[i][3];
    const rowTime = data[i][4] ? data[i][4].toString().trim() : '';
    const status = data[i][6] ? data[i][6].toString().trim().toLowerCase() : '';
    const rowDoctor = data[i][2] ? data[i][2].toString().trim().toLowerCase() : '';
    
    let formattedRowDate = '';
    if (rawDate instanceof Date) {
      formattedRowDate = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else if (rawDate) {
      formattedRowDate = rawDate.toString().trim();
    }
    
    if (
      formattedRowDate === dateStr &&
      rowDoctor === targetDoctor &&
      status !== 'cancelled' &&
      rowTime
    ) {
      bookedSlots.push(rowTime);
    }
  }
  
  return bookedSlots;
}