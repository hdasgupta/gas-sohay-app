/**
 * Ensures required sheets exist with standard headers.
 */
function initDatabase() {
  getOrCreateSheet('Users', ['ID', 'Name', 'Location', 'Email', 'Phone', 'Password', 'Role']);
  getOrCreateSheet('Doctors', ['ID', 'Name', 'Specialty', 'Email', 'Phone', 'Password', 'AvailabilityJSON']);
  getOrCreateSheet('Appointments', ['ID', 'PatientEmail', 'DoctorEmail', 'Date', 'Time', 'MeetLink', 'Status']);
  getOrCreateSheet('Medicines', ['Name and Power']);
  

  // Pre-seed Default Admin Account if Users sheet is empty
  var userSheet = getOrCreateSheet('Users');
  
  if (userSheet.getLastRow() == 1) {
    userSheet.appendRow(['ADM-1', 'System Admin', 'HQ', 'admin@hospital.com', '0000000000', 'admin123', 'admin']);
  }
}

/**
 * Utility to fetch or create a sheet tab by name.
 */
function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) sheet.appendRow(headers);
  }
  return sheet;
}
