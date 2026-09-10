/**
 * Fetches all appointments for a specific patient email (or all if omitted).
 */
function getAppointmentsForUser(patientEmail) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const appointments = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowPatientEmail = row[1] ? row[1].toString().trim().toLowerCase() : '';
    
    if (!patientEmail || rowPatientEmail === patientEmail.trim().toLowerCase()) {
      appointments.push({
        id: row[0] ? row[0].toString() : '',
        patient: getPatientByEmail(row[1]),
        doctor: getDoctorByEmail(row[2]),
        date: row[3] ? JSON.parse(row[3].toString()) : '',
        time: row[4] ? JSON.parse(row[4].toString()) : '',
        meetLink: row[5] ? row[5].toString() : '',
        status: row[6] ? row[6].toString() : '',
        prescriptionLink: row[7] ? row[7].toString() : ''
      });
    }
  }

  return appointments.reverse(); // Newest first
}

/**
 * Cancels an appointment if requested at least 1 day prior to the appointment date.
 * Updates status to 'Cancelled' in the 'Appointments' sheet and emails the patient.
 */
function cancelAppointment(appointmentId) {
  if (!appointmentId) {
    return { success: false, error: "Appointment ID is required." };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  if (!sheet) {
    return { success: false, error: "Appointments sheet not found." };
  }

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  let targetRow = null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() === appointmentId.trim()) {
      rowIndex = i + 1; // 1-based index in Apps Script
      targetRow = data[i];
      break;
    }
  }

  if (rowIndex === -1) {
    return { success: false, error: "Appointment record not found." };
  }

  const patientEmail = targetRow[1];
  const doctorEmail = targetRow[2];
  const dateStr = targetRow[3];
  const timeStr = targetRow[4];
  const currentStatus = targetRow[6];

  if (currentStatus.toLowerCase() === "cancelled") {
    return { success: false, error: "This appointment is already cancelled." };
  }

  // Verify date restriction: Must be at least 1 day before appointment date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const apptDate = new Date(dateStr + "T00:00:00");
  apptDate.setHours(0, 0, 0, 0);

  const diffInDays = Math.floor((apptDate - today) / (1000 * 60 * 60 * 24));

  if (diffInDays < 1) {
    return {
      success: false,
      error: "Appointments can only be cancelled at least 1 day prior to the scheduled date."
    };
  }

  // Update Status column (Column 7 / G) to 'Cancelled'
  sheet.getRange(rowIndex, 7).setValue("Cancelled");

  // Send cancellation email to patient
  sendCancellationEmail(patientEmail, doctorEmail, dateStr, timeStr, appointmentId);

  return {
    success: true,
    message: "Appointment cancelled successfully. A notification email has been sent."
  };
}

/**
 * Sends cancellation notification email to patient.
 */
function sendCancellationEmail(patientEmail, doctorEmail, dateStr, timeSlotStr, appointmentId) {
  try {
    const subject = `Appointment Cancelled - ID: ${appointmentId}`;
    const bodyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #dc2626; margin-top: 0;">Appointment Cancelled</h2>
        <p>Dear Patient,</p>
        <p>Your appointment has been cancelled as requested. Summary details are below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px 0; font-weight: bold;">Appointment ID:</td><td>${appointmentId}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Doctor Email:</td><td>${doctorEmail}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Date:</td><td>${dateStr}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Time Slot:</td><td>${timeSlotStr}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td><span style="color: #dc2626; font-weight: bold;">Cancelled</span></td></tr>
        </table>
        <p style="font-size: 12px; color: #64748b;">If you need to reschedule, please visit the appointment booking portal.</p>
      </div>
    `;

    MailApp.sendEmail({
      to: patientEmail,
      subject: subject,
      htmlBody: bodyHtml
    });
  } catch (err) {
    Logger.log("Cancellation Email Error: " + err.toString());
  }
}
