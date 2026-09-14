/**
 * 1. Search for active scheduled/rescheduled appointment by patient and doctor email
 */
function findActiveAppointment(patientEmail, doctorEmail) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idx = {
    id: 0,
    patientEmail: 1,
    doctorEmail: 2,
    date: 3,
    time: 4,
    meetLink: 5,
    status: 6,
    prescriptionLink: 7
  };
  
  const pEmail = patientEmail.trim().toLowerCase();
  const dEmail = doctorEmail.trim().toLowerCase();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowStatus = String(row[idx.status]).toLowerCase();
    const rowPatient = String(row[idx.patientEmail]).trim().toLowerCase();
    const rowDoctor = String(row[idx.doctorEmail]).trim().toLowerCase();
    
    if (
      rowPatient === pEmail &&
      rowDoctor === dEmail &&
      (rowStatus === "scheduled" || rowStatus === "rescheduled")
    ) {
      return {
        success: true,
        appointment: {
          id: String(row[idx.id]),
          patientEmail: row[idx.patientEmail],
          doctorEmail: row[idx.doctorEmail],
          date: formatDate(JSON.parse(row[idx.date])),
          time: String(JSON.parse(row[idx.time])).trim(),
          meetLink: row[idx.meetLink],
          status: row[idx.status],
          prescriptionLink: row[idx.prescriptionLink]
        }
      };
    }
  }
  
  return { success: false, message: "No active (Scheduled/Rescheduled) appointment found for this patient and doctor." };
}

/**
 * 2. Get available time slots for a given doctor & patient on a selected date
 * Checks doctor's weekday availability schedule & filters out existing appointment conflicts.
 */
function getAvailableSlots(doctorEmail, patientEmail, selectedDateStr, currentAppointmentId) {
  const dEmail = doctorEmail.trim().toLowerCase();
  const pEmail = patientEmail.trim().toLowerCase();
  
  // Step A: Fetch Doctor's Weekday Availability Array from "Doctors" sheet
  const docSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Doctors");
  const doctor = getDoctorByEmail(doctorEmail);
  const patient = getPatientByEmail(patientEmail)
  
  let doctorAvailability = doctor. availability;
  
  
  // Determine weekday name from selectedDateStr (YYYY-MM-DD)
  const dateParts = selectedDateStr.split("-");
  const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const selectedWeekday = weekdays[dateObj.getDay()];
  
  const daySlots = doctorAvailability[selectedWeekday] || [];
  if (daySlots.length === 0) {
    return { success: true, slots: [], message: `Doctor is not available on ${selectedWeekday}s.` };
  }
  
  // Step B: Get all booked slots on selectedDateStr for Doctor OR Patient
  const appSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  const appData = appSheet.getDataRange().getValues();
  const appHeaders = appData[0];
  
  const idx = {
    id: 0,
    patientEmail: 1,
    doctorEmail: 2,
    date: 3,
    time: 4,
    status: 5
  };
  
  const currentApp = getAppointmentById(appData, idx, currentAppointmentId);
  const occupiedSlots = new Set();
  
  for (let i = 1; i < appData.length; i++) {
    const rowId = String(appData[i][idx.id]);
    const rowStatus = String(appData[i][idx.status]).toLowerCase();
    
    // Ignore current appointment row and cancelled appointments
    if (rowId === String(currentAppointmentId) || rowStatus === "cancelled") {
      continue;
    }
    
    const rowDate = formatDate(appData[i][idx.date]);
    const rowDoctor = String(appData[i][idx.doctorEmail]).trim().toLowerCase();
    const rowPatient = String(appData[i][idx.patientEmail]).trim().toLowerCase();
    
    if (rowDate === selectedDateStr) {
      // Slot is blocked if Doctor OR Patient is already booked
      if (rowDoctor === dEmail || rowPatient === pEmail) {
        occupiedSlots.add(String(appData[i][idx.time]).trim());
      }
    }
  }
  
  // Filter out occupied slots
  let availableSlots = daySlots.filter(slot => !occupiedSlots.has(slot));
  
  // Step C: Rule - Cannot reschedule to the exact same date AND time
  if (currentApp && currentApp.date === selectedDateStr) {
    availableSlots = availableSlots.filter(slot => slot !== currentApp.time);
  }
  
  return { success: true, slots: availableSlots };
}

/**
 * 3. Execute Reschedule Update on "Appointments" sheet
 *
 * Reschedules an existing appointment with conflict checks.
 * 
 * @param {string} appointmentId - ID of the appointment to reschedule
 * @param {string} newDate - Date in YYYY-MM-DD format
 * @param {string} newTime - Time slot (e.g., "10:00 AM")
 * @returns {object} Result object { success: boolean, message: string }
 */
function updateAppointmentSchedule(appointmentId, newDate, newTime) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const idIdx = 0;
  const dateIdx = 3;
  const timeIdx = 4;
  const statusIdx = 5;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(appointmentId)) {
      const rowNum = i + 1;
      sheet.getRange(rowNum, dateIdx + 1).setValue(JSON.stringify(newDate));
      sheet.getRange(rowNum, timeIdx + 1).setValue(JSON.stringify(newTime));
      sheet.getRange(rowNum, statusIdx + 1).setValue("Rescheduled");

      return { success: true, message: `Appointment successfully rescheduled to ${newDate} at ${newTime}.` };
    }
  }

  return { success: false, message: "Failed to locate appointment ID for update." };
}

function formatDate(dateVal) {
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(dateVal).trim();
}

function getAppointmentById(data, idx, apptId) {
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.id]) === String(apptId)) {
      return {
        date: formatDate(JSON.parse(data[i][idx.date])),
        time: String(JSON.parse(data[i][idx.time])).trim()
      };
    }
  }
  return null;
}