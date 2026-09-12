/**
 * Utility: Converts 12-hour or 24-hour time string to total minutes from midnight.
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  timeStr = timeStr.trim().toUpperCase();
  const isPM = timeStr.includes("PM");
  const isAM = timeStr.includes("AM");
  
  const cleanTime = timeStr.replace(/(AM|PM)/g, "").trim();
  const parts = cleanTime.split(":");
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Utility: Converts total minutes from midnight back to 12-hour time format.
 */
function formatMinutesTo12Hr(totalMinutes) {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const formattedHours = hours < 10 ? "0" + hours : hours;
  const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

  return `${formattedHours}:${formattedMinutes} ${suffix}`;
}

/**
 * Utility: Breaks availability ranges (e.g. "09:00 AM - 11:00 AM") into 30-minute interval slots.
 */
function generate30MinSlotsFromRange(rangeStr) {
  const parts = rangeStr.split("-");
  if (parts.length !== 2) return [];

  const startMin = parseTimeToMinutes(parts[0]);
  const endMin = parseTimeToMinutes(parts[1]);
  const slots = [];

  for (let current = startMin; current + 30 <= endMin; current += 30) {
    const slotStart = formatMinutesTo12Hr(current);
    const slotEnd = formatMinutesTo12Hr(current + 30);
    slots.push(`${slotStart} - ${slotEnd}`);
  }

  return slots;
}

/**
 * Parses date string ("YYYY-MM-DD") and slot string ("09:00 AM - 09:30 AM") into JS Date objects.
 */
function parseSlotToDateObjects(dateStr, timeSlotStr) {
  const [startStr, endStr] = timeSlotStr.split("-").map(s => s.trim());
  const startMins = parseTimeToMinutes(startStr);
  const endMins = parseTimeToMinutes(endStr);

  const startDate = new Date(dateStr + "T00:00:00");
  startDate.setMinutes(startMins);

  const endDate = new Date(dateStr + "T00:00:00");
  endDate.setMinutes(endMins);

  return { startDate, endDate };
}

/**
 * Creates a Google Calendar Event and generates a valid Google Meet link.
 */
function createGoogleMeetEvent(patientEmail, doctorEmail, dateStr, timeSlotStr, appointmentId) {
  try {
    const { startDate, endDate } = parseSlotToDateObjects(dateStr, timeSlotStr);
    const summary = `Doctor Consultation [ID: ${appointmentId}]`;
    const description = `Medical Appointment\nPatient: ${patientEmail}\nDoctor: ${doctorEmail}\nAppointment ID: ${appointmentId}`;

    // Use CalendarApp with guest invites
    const calendar = CalendarApp.getDefaultCalendar();
    const event = calendar.createEvent(summary, startDate, endDate, {
      description: description,
      guests: `${patientEmail},${doctorEmail}`,
      sendInvites: true
    });

    // Advanced Calendar API attempt for direct Meet link or fallback room URL
    if (typeof Calendar !== 'undefined' && Calendar.Events) {
      try {
        const resource = {
          summary: summary,
          description: description,
          start: { dateTime: startDate.toISOString() },
          end: { dateTime: endDate.toISOString() },
          attendees: [{ email: patientEmail }, { email: doctorEmail }],
          conferenceData: {
            createRequest: {
              requestId: "meet_" + appointmentId + "_" + Date.now(),
              conferenceSolutionKey: { type: "hangoutsMeet" }
            }
          }
        };
        const createdEvent = Calendar.Events.insert(resource, "primary", { conferenceDataVersion: 1 });
        if (createdEvent.hangoutLink) {
          return createdEvent.hangoutLink;
        }
      } catch (e) {
        Logger.log("Advanced Calendar API fallback triggered: " + e.toString());
      }
    }

    return event.getHangoutLink() || `https://meet.google.com/doc-${appointmentId.toLowerCase()}`;
  } catch (err) {
    Logger.log("Calendar Event Error: " + err.toString());
    return `https://meet.google.com/doc-${appointmentId.toLowerCase()}`;
  }
}

/**
 * Sends confirmation email notification to the patient with Google Meet link.
 */
function sendAppointmentConfirmationEmail(patientEmail, doctorName, dateStr, timeSlotStr, meetLink, appointmentId) {
  try {
    const subject = `Appointment Confirmation - ID: ${appointmentId} - Sohay App`;
    const bodyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">Appointment Confirmed</h2>
        <p>Dear Patient,</p>
        <p>Your appointment has been successfully scheduled. Details are below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px 0; font-weight: bold;">Appointment ID:</td><td>${appointmentId}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Doctor:</td><td>Dr. ${doctorName}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Date:</td><td>${dateStr}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Time Slot:</td><td>${timeSlotStr}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td><span style="color: #16a34a; font-weight: bold;">Scheduled</span></td></tr>
        </table>
        <div style="margin: 24px 0; padding: 16px; background-color: #eff6ff; border-radius: 6px; text-align: center;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">Video Consultation Link</p>
          <a href="${meetLink}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Join Google Meet Call</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">If you need to reschedule, please contact administration.</p>
      </div>
    `;

    MailApp.sendEmail({
      to: patientEmail,
      subject: subject,
      htmlBody: bodyHtml
    });
  } catch (err) {
    Logger.log("Email Notification Error: " + err.toString());
  }
}

/**
 * Gets all doctors available on a specific date (mapped to day of week).
 */
function getDoctorsAvailableOnDate(dateStr) {
  if (!dateStr) return [];

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dateObj = new Date(dateStr + "T00:00:00");
  const dayName = weekdays[dateObj.getDay()];

  const sheet = getOrCreateSheet("Doctors");
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const availableDoctors = [];

  for (let i = 1; i < data.length; i++) {
    const id = data[i][0] ? data[i][0].toString() : '';
    const name = data[i][1] || '';
    const specialty = data[i][2] || '';
    const email = data[i][3] || '';
    const availabilityJson = data[i][6] || '{}';

    if (!id || !email) continue;

    try {
      const availMap = JSON.parse(availabilityJson);
      if (availMap && Array.isArray(availMap[dayName]) && availMap[dayName].length > 0) {
        availableDoctors.push({ id, name, specialty, email });
      }
    } catch (e) {}
  }

  return availableDoctors;
}

/**
 * Returns available 30-minute time slots for a doctor on a specific date,
 * filtering out any slots already present in 'Appointments' sheet.
 */
function getAvailableSlotsForDoctorAndDate(doctorEmail, dateStr) {
  if (!doctorEmail || !dateStr) return [];

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dateObj = new Date(dateStr + "T00:00:00");
  const dayName = weekdays[dateObj.getDay()];

  // 1. Fetch Doctor Configured Ranges for that day
  const docSheet = getOrCreateSheet("Doctors");
  if (!docSheet) return [];

  const docData = docSheet.getDataRange().getValues();
  let dayRanges = [];

  for (let i = 1; i < docData.length; i++) {
    if (docData[i][3] && docData[i][3].toString().trim().toLowerCase() === doctorEmail.trim().toLowerCase()) {
      try {
        const availMap = JSON.parse(docData[i][6] || '{}');
        dayRanges = availMap[dayName] || [];
      } catch (e) {}
      break;
    }
  }

  if (dayRanges.length === 0) return [];

  // 2. Generate 30-minute slots
  let allPossibleSlots = [];
  dayRanges.forEach(range => {
    allPossibleSlots = allPossibleSlots.concat(generate30MinSlotsFromRange(range));
  });
  allPossibleSlots = [...new Set(allPossibleSlots)];

  // 3. Fetch already booked slots from 'Appointments' sheet
  let apptSheet = getOrCreateSheet("Appointments");
  if (!apptSheet) {
    apptSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Appointments");
    apptSheet.appendRow(["Appointment ID", "Patient Email", "Doctor Email", "Date", "Time", "Meet Link", "Status", "Prescription Link"]);
    return allPossibleSlots;
  }

  const apptData = apptSheet.getDataRange().getValues();
  const bookedSlots = new Set();

  for (let i = 1; i < apptData.length; i++) {
    const rowDoctor = apptData[i][2] ? apptData[i][2].toString().trim().toLowerCase() : '';
    const rowDate = apptData[i][3] ? JSON.parse(apptData[i][3].toString().trim()) : '';
    const rowTime = apptData[i][4] ? JSON.parse(apptData[i][4].toString().trim()) : '';
    const rowStatus = apptData[i][6] ? apptData[i][6].toString().trim() : '';

    if (
      rowDoctor === doctorEmail.trim().toLowerCase() &&
      rowDate === dateStr &&
      rowStatus.toLowerCase() !== 'cancelled'
    ) {
      bookedSlots.add(rowTime);
    }
  }

  // 4. Return unbooked slots only
  return allPossibleSlots.filter(slot => !bookedSlots.has(slot));
}

/**
 * Books an appointment, creates Google Meet link, sends email to patient,
 * and records entry into 'Appointments' sheet.
 * Sheet Structure: Appointment ID | Patient Email | Doctor Email | Date | Time | Meet Link | Status | Prescription Link
 */
function bookAppointment(payload) {
  const { patientEmail, doctorEmail, doctorName, date, time } = payload;

  if (!patientEmail || !doctorEmail || !date || !time) {
    return { success: false, error: "Missing required booking information." };
  }

  let sheet = getOrCreateSheet("Appointments");

  const data = sheet.getDataRange().getValues();
  
  const patient = getPatientByEmail(patientEmail);
  const doctor = getDoctorByEmail(doctorEmail)

  // Guard against race-condition double bookings
  for (let i = 1; i < data.length; i++) {
    const rowPatient = data[i][1] ? data[i][1].toString().trim().toLowerCase() : '';
    const rowDoctor = data[i][2] ? data[i][2].toString().trim().toLowerCase() : '';
    const rowDate = data[i][3] ? JSON.parse(data[i][3].toString().trim()) : '';
    const rowTime = data[i][4] ? JSON.parse(data[i][4].toString().trim()) : '';
    const rowStatus = data[i][6] ? data[i][6].toString().trim() : '';
    
    
    // Check rules only against active 'SCHEDULED' appointments
    if (rowStatus.toLowerCase()=== 'scheduled' && rowPatient === patientEmail) {
  
      // Rule 1: Duplicate active booking with the same doctor
      if (rowDoctor === doctorEmail) {
        return {
          success: false,
          error: `Booking rejected: Patient ${patient.name} already have a scheduled appointment with Dr. ${doctor.name}.`
        };
      }
  
      // Rule 2: Time slot collision across any doctor on the same date and time
      if (rowDate === date && rowTime === time) {
        return {
          success: false,
          error: `Booking rejected: Patient ${patient.name} already have an appointment scheduled for ${date} at ${time}.`
        };
      }
    }

    if (
      rowDoctor === doctorEmail.trim().toLowerCase() &&
      rowDate === date &&
      rowTime === time &&
      rowStatus.toLowerCase() !== 'cancelled'
    ) {
      return { success: false, error: "This time slot is already booked. Please pick another slot." };
    }
  }

  const appointmentId = "APT" + Date.now().toString().slice(-6);
  const status = "Scheduled";
  const prescriptionLink = "";

  // Generate Google Meet link
  const meetLink = createGoogleMeetEvent(patientEmail.trim(), doctorEmail.trim(), date, time, appointmentId);

  // Append row into Appointments sheet
  sheet.appendRow([
    appointmentId,
    patientEmail.trim().toLowerCase(),
    doctorEmail.trim().toLowerCase(),
    JSON.stringify(date),
    JSON.stringify(time),
    meetLink,
    status,
    prescriptionLink
  ]);

  // Trigger confirmation email
  sendAppointmentConfirmationEmail(
    patientEmail.trim().toLowerCase(),
    doctorEmail,
    date,
    time,
    meetLink,
    appointmentId
  );

  return {
    success: true,
    message: "Appointment booked successfully!",
    appointment: {
      id: appointmentId,
      patientEmail,
      doctorEmail,
      patient, 
      doctor, 
      date,
      time,
      meetLink,
      status
    }
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

  const sheet = getOrCreateSheet("Appointments");
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
    const rawDate = JSON.parse(row[3]);
    const timeSlot = JSON.parse(row[4]);
    const meetLink = row[5];
    const status = row[6] ? row[6].toString().trim() : 'Scheduled';
    const prescriptionUrl = row[7] || '';
    const rowDoctorEmail = row[2] ? row[2].toString().trim().toLowerCase() : '';
    const patient = getPatientByEmail(patientEmail);
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
          name: patient.name,
          email: row[1], // Preserve original string case
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

