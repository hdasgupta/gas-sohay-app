/**
 * Checks if a patient already has an active scheduled appointment with a specific doctor.
 * @param {Array} appointments - List of all existing appointments
 * @param {string} patientEmail - The email of the current patient
 * @param {string} doctorEmail - The email of the selected doctor
 * @returns {boolean} - True if an active booking exists, false otherwise
 */
export const hasExistingScheduledBooking = (appointments, patientEmail, doctorEmail) => {
  return appointments.some(
    (appt) =>
      appt.patientEmail.toLowerCase() === patientEmail.toLowerCase() &&
      appt.doctorEmail.toLowerCase() === doctorEmail.toLowerCase() &&
      appt.status.toLowerCase() === 'scheduled'
  );
};
