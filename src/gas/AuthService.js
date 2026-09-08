/**
 * Validates credentials across Users and Doctors sheets.
 */
function authenticateUser(email, password) {
  initDatabase();
  
  // Check Users (Patients & Admins)
  var userSheet = getOrCreateSheet('Users');
  var users = userSheet.getDataRange().getValues();
  for (var i = 1; i < users.length; i++) {
    if (users[i][3] === email && users[i][5] === password) {
      return {
        success: true,
        user: { id: users[i][0], name: users[i][1], location: users[i][2], email: users[i][3], phone: users[i][4], role: users[i][6] }
      };
    }
  }

  // Check Doctors (Doctors logging in directly)
  var docSheet = getOrCreateSheet('Doctors');
  var docs = docSheet.getDataRange().getValues();
  for (var j = 1; j < docs.length; j++) {
    if (docs[j][3] === email && docs[j][5] === password) {
      return {
        success: true,
        user: { id: docs[j][0], name: docs[j][1], location: 'Clinic', email: docs[j][3], phone: docs[j][4], role: 'doctor' }
      };
    }
  }

  return { success: false, message: 'Invalid email or password' };
}

/**
 * Registers a new patient account.
 */
function registerPatient(data) {
  initDatabase();
  var sheet = getOrCreateSheet('Users');
  var users = sheet.getDataRange().getValues();
  
  for (var i = 1; i < users.length; i++) {
    if (users[i][3] === data.email) return { success: false, message: 'Email already registered.' };
  }

  var userId = 'USR-' + new Date().getTime();
  sheet.appendRow([userId, data.name, data.location, data.email, data.phone, data.password, 'patient']);
  
  return {
    success: true,
    user: { id: userId, name: data.name, location: data.location, email: data.email, phone: data.phone, role: 'patient' }
  };
}

function searchPatientByEmail(email) {
  // Tab to edit
  var userSheet = getOrCreateSheet('Users');
  var users = userSheet.getDataRange().getValues();
  for (var i = 1; i < users.length; i++) {
    if (users[i][3] === email && ) {
      return {
         id: users[i][0], 
         name: users[i][1], 
         location: users[i][2], 
         email: users[i][3], 
         phone: users[i][4], 
         role: users[i][6] 
      };
    }
  }
}