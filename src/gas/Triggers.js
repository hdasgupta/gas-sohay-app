/**
 * Searches past appointments and marks them as 'Cancelled' if no prescription URL exists.
 * 
 * Column Mapping (1-indexed for Sheet ranges):
 * Col 1 (A): ApptID
 * Col 2 (B): PatientEmail
 * Col 3 (C): DoctorEmail
 * Col 4 (D): Date
 * Col 5 (E): Time
 * Col 6 (F): Meet link
 * Col 7 (G): Status
 * Col 8 (H): PrescriptionUrl
 * 
 * @return {Object} Status and count of cancelled appointments.
 */
function cancelPastAppointmentsWithoutPrescription() {
  const sheet = getOrCreateSheet("Appointments");
  if (!sheet) return { success: false, error: "Appointments sheet not found." };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, updatedCount: 0 };

  // Set today's date at midnight (00:00:00) for accurate date comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let updatedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rawDate = JSON.parse(row[3]);
    const status = row[6] ? row[6].toString().trim() : '';
    const prescriptionUrl = row[7] ? row[7].toString().trim() : '';

    if (!rawDate) continue;

    // Parse appointment date to midnight Date object
    let apptDate;
    if (rawDate instanceof Date) {
      apptDate = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
    } else if (typeof rawDate === 'string' && rawDate.trim()) {
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        apptDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        apptDate = new Date(rawDate);
      }
    }
    
    console.log(apptDate, today);

    if (!apptDate || isNaN(apptDate.getTime())) continue;

    // Check if appointment is in the past, missing a prescription URL, and not already cancelled
    const isPast = apptDate < today;
    const hasNoPrescription = !prescriptionUrl;
    const isNotCancelled = status.toLowerCase() !== 'cancelled';

    if (isPast && hasNoPrescription && isNotCancelled) {
      const rowIndex = i + 1; // 1-indexed row number in Google Sheets
      sheet.getRange(rowIndex, 7).setValue('CANCELLED'); // Column 6 (F) is Status
      updatedCount++;
    }
  }

  return {
    success: true,
    updatedCount: updatedCount,
    message: `Marked ${updatedCount} past appointment(s) as Cancelled.`
  };
}
