/**
 * Retrieves all registered doctors.
 */
function getDoctorsList() {
  initDatabase();
  var sheet = getOrCreateSheet('Doctors');
  var data = sheet.getDataRange().getValues();
  var doctors = [];

  for (var i = 1; i < data.length; i++) {
    doctors.push({
      id: data[i][0],
      name: data[i][1],
      specialty: data[i][2],
      email: data[i][3],
      phone: data[i][4],
      password: data[i][5],
      availability: JSON.parse(data[i][6] || '[]')
    });
  }
  return doctors;
}

/**
 * Creates or updates doctor records (Admin level).
 */
function upsertDoctor(doc) {
  initDatabase();
  var sheet = getOrCreateSheet('Doctors');
  var data = sheet.getDataRange().getValues();
  var availJson = JSON.stringify(doc.availability || ['09:00', '10:30', '14:00']);

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === doc.id || data[i][3] === doc.email) {
      sheet.getRange(i + 1, 2, 1, 6).setValues([[
        doc.name, doc.specialty, doc.email, doc.phone, doc.password, availJson
      ]]);
      return { success: true, message: 'Doctor record updated successfully.' };
    }
  }

  var newId = 'DOC-' + new Date().getTime();
  sheet.appendRow([newId, doc.name, doc.specialty, doc.email, doc.phone, doc.password, availJson]);
  return { success: true, message: 'New doctor added successfully.' };
}

function getDoctorByEmail(email) {
  // Tab to edit
  return getDoctorsList().map((doctor) => doctor.email === email)[0]
}