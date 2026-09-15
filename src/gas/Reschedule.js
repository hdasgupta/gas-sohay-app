/**
 * 1. Suggestions data for Patients and Doctors
 */
function getSuggestionOptions() {
  
  return { doctors: getDoctorsList(), patients: getPatientMaster() };
}

/**
 * 2. Search active upcoming appointment using fixed column indices
 * Fixed Sequence: [0: id, 1: patientemail, 2: doctoremail, 3: date, 4: time, 5: meetlink, 6: status, 7: prescription link]
 */
function findActiveAppointment(patientEmail, doctorEmail) {
  
  const data = getAllData("Appointments");

  const pEmail = String(patientEmail).trim().toLowerCase();
  const dEmail = String(doctorEmail).trim().toLowerCase();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowPatient = String(row[1]).trim().toLowerCase();
    const rowDoctor = String(row[2]).trim().toLowerCase();
    const rowStatus = String(row[6]).trim().toLowerCase();

    if (
      rowPatient === pEmail &&
      rowDoctor === dEmail &&
      (rowStatus === "scheduled" || rowStatus === "rescheduled")
    ) {
      return {
        success: true,
        appointment: {
          id: String(row[0]),
          patientemail: row[1],
          doctoremail: row[2],
          date: formatDate(JSON.parse(row[3])),
          time: String(JSON.parse(row[4])).trim(),
          meetlink: row[5],
          status: row[6],
          prescriptionlink: row[7]
        }
      };
    }
  }

  return { success: false, message: "No active scheduled/rescheduled appointment found." };
}

/**
 * 3. Fetch 30-minute available slots, enforcing double-booking & date-time difference rules
 */
function getAvailableSlots(doctorEmail, patientEmail, selectedDateStr, currentAppointmentId) {
  const dEmail = String(doctorEmail).trim().toLowerCase();
  const pEmail = String(patientEmail).trim().toLowerCase();

  // Fetch doctor availability schedule
  const docData = getAllData("Doctors");

  let rawAvailability = {};
  for (let i = 0; i < docData.length; i++) {
    if (String(docData[i][3]).trim().toLowerCase() === dEmail) {
      try {
        rawAvailability = typeof docData[i][6] === 'string'
          ? JSON.parse(docData[i][6])
          : docData[i][6];
      } catch (e) {
        return { success: false, message: "Invalid JSON in doctor.availability column." };
      }
      break;
    }
  }

  // Determine weekday name
  const dateParts = selectedDateStr.split("-");
  const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const selectedWeekday = weekdays[dateObj.getDay()];

  const rawDaySchedule = rawAvailability[selectedWeekday] || [];
  
  // Expand weekday window into 30-minute time slots
  const all30MinSlots = breakInto30MinSlots(rawDaySchedule);

  if (all30MinSlots.length === 0) {
    return { success: true, slots: [], message: `Doctor is not available on ${selectedWeekday}s.` };
  }

  // Cross-reference conflict with existing appointments
  const appData = getAllData("Appointments");

  let currentApptDate = "";
  let currentApptTime = "";

  // Locate current appointment details
  for (let i = 0; i < appData.length; i++) {
    if (String(appData[i][0]) === String(currentAppointmentId)) {
      currentApptDate = formatDate(JSON.parse(appData[i][3]));
      currentApptTime = String(JSON.parse(appData[i][4])).trim();
      break;
    }
  }

  const occupiedSlots = new Set();

  for (let i = 0; i < appData.length; i++) {
    const rowId = String(appData[i][0]);
    const rowStatus = String(appData[i][6]).trim().toLowerCase();

    if (rowId === String(currentAppointmentId) || rowStatus === "cancelled") {
      continue;
    }

    const rowDate = formatDate(JSON.parse(appData[i][3]));
    const rowDoctor = String(appData[i][2]).trim().toLowerCase();
    const rowPatient = String(appData[i][1]).trim().toLowerCase();
    const rowTime = String(JSON.parse(appData[i][4])).trim();

    // Prevent conflict: doctor or patient double-booking on same date & time
    if (rowDate === selectedDateStr && (rowDoctor === dEmail || rowPatient === pEmail)) {
      occupiedSlots.add(rowTime);
    }
  }

  // Filter out occupied slots
  let availableSlots = all30MinSlots.filter(slot => !occupiedSlots.has(slot));

  // Constraint: Cannot reschedule to the exact same date and time slot
  if (selectedDateStr === currentApptDate) {
    availableSlots = availableSlots.filter(slot => slot !== currentApptTime);
  }

  return { success: true, slots: availableSlots };
}

/**
 * Helper: Converts schedule ranges/arrays into 30-minute interval slots
 */
function breakInto30MinSlots(scheduleArray) {
  const slots = [];
  if (!Array.isArray(scheduleArray)) return slots;

  scheduleArray.forEach(item => {
    const strItem = String(item).trim();
    if (strItem.includes('-')) {
      const parts = strItem.split('-').map(p => p.trim());
      let startMins = parseTimeToMinutes(parts[0]);
      let endMins = parseTimeToMinutes(parts[1]);

      if (startMins !== null && endMins !== null) {
        let curr = startMins;
        while (curr < endMins) {
          slots.push(formatMinutesToTime(curr));
          curr += 30;
        }
      }
    } else {
      slots.push(strItem);
    }
  });

  return slots;
}

/*
function parseTimeToMinutes(timeStr) {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm) {
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
}*/

function formatMinutesToTime(totalMinutes) {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minsStr = minutes < 10 ? '0' + minutes : minutes;
  const hrsStr = hours < 10 ? '0' + hours : hours;
  return `${hrsStr}:${minsStr} ${ampm}`;
}

/**
 * 4. Update row directly using fixed sequence indices
 * Fixed Sequence: [0: id, 1: patientemail, 2: doctoremail, 3: date, 4: time, 5: meetlink, 6: status, 7: prescription link]
 */
function updateAppointmentSchedule(appointmentId, newDate, newTime) {
  
  const data = getAllData("Appointments");

  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(appointmentId)) {
      const rowNum = i + 1;
      // Sheet columns are 1-indexed (date: 4, time: 5, status: 7)
      sheet.getRange(rowNum, 4).setValue(JSON.stringify(newDate));
      sheet.getRange(rowNum, 5).setValue(JSON.stringify(newTime));
      sheet.getRange(rowNum, 7).setValue("Rescheduled");

      return { success: true, message: `Appointment rescheduled to ${newDate} at ${newTime}.` };
    }
  }

  return { success: false, message: "Appointment ID not found." };
}

function formatDate(dateVal) {
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(dateVal).trim();
}
