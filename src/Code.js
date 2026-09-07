// Enable "Calendar API" under Google Apps Script Services for Meet Link auto-generation

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Doctor Appointment System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function registerUser(userData) {
  var sheet = getOrCreateSheet('Users');
  var existing = sheet.getDataRange().getValues();
  
  for (var i = 1; i < existing.length; i++) {
    if (existing[i][3] === userData.email) {
      return { success: false, message: 'Email already registered.' };
    }
  }
  
  // Store user record: [ID, Name, Location, Email, Phone, EncryptedPassword]
  var userId = 'USR-' + new Date().getTime();
  sheet.appendRow([userId, userData.name, userData.location, userData.email, userData.phone, userData.password]);
  
  return { 
    success: true, 
    user: { id: userId, name: userData.name, email: userData.email, location: userData.location, phone: userData.phone }
  };
}

function loginUser(email, password) {
  var sheet = getOrCreateSheet('Users');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][3] === email && data[i][5] === password) {
      return {
        success: true,
        user: { id: data[i][0], name: data[i][1], location: data[i][2], email: data[i][3], phone: data[i][4] }
      };
    }
  }
  return { success: false, message: 'Invalid email or password.' };
}

function bookAppointment(bookingData) {
  var startDateTime = new Date(bookingData.date + 'T' + bookingData.time);
  var endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 mins duration

  // Create Google Calendar event with Google Meet using Advanced Calendar Service
  var eventPayload = {
    summary: 'Medical Appointment: ' + bookingData.doctorName,
    description: 'Patient: ' + bookingData.userName + '\nPhone: ' + bookingData.userPhone,
    start: { dateTime: startDateTime.toISOString() },
    end: { dateTime: endDateTime.toISOString() },
    attendees: [{ email: bookingData.userEmail }],
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
  sheet.appendRow([
    bookingId, bookingData.userName, bookingData.userEmail, bookingData.doctorName,
    bookingData.date, bookingData.time, meetLink, new Date()
  ]);

  // Send Confirmation Email
  MailApp.sendEmail({
    to: bookingData.userEmail,
    subject: 'Appointment Confirmation & Google Meet Link',
    htmlBody: `
      <h2>Appointment Confirmed</h2>
      <p>Hello <b>${bookingData.userName}</b>,</p>
      <p>Your appointment with <b>${bookingData.doctorName}</b> is scheduled for <b>${bookingData.date} at ${bookingData.time}</b>.</p>
      <p><b>Join Google Meet:</b> <a href="${meetLink}">${meetLink}</a></p>
    `
  });

  return { success: true, bookingId: bookingId, meetLink: meetLink };
}

function getOrCreateSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === 'Users') sheet.appendRow(['ID', 'Name', 'Location', 'Email', 'Phone', 'Password']);
    if (sheetName === 'Appointments') sheet.appendRow(['ID', 'Patient', 'Email', 'Doctor', 'Date', 'Time', 'MeetLink', 'Created']);
  }
  return sheet;
}
