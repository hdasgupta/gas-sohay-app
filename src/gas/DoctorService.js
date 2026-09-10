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
      speciality: data[i][2],
      email: data[i][3],
      phone: data[i][4],
      password: data[i][5],
      availability: JSON.parse(data[i][6] || '{}')
    });
  }
  return doctors;
}

/**
 * Saves or updates a doctor record in the 'Doctors' sheet.
 * Sheet Schema: [id, name, speciality, email, phone, password, availabilityjson]
 */
function saveDoctor(payload) {
  const { id, name, speciality, email, phone, password, confirmPassword, availability } = payload;

  // 1. Mandatory Fields Validation
  if (!name || !speciality || !email || !phone || !availability) {
    return { success: false, error: "Name, speciality, email, phone, and availability are required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { success: false, error: "Invalid email address format." };
  }

  const cleanPhone = phone.toString().replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return { success: false, error: "Phone number must contain at least 10 digits." };
  }

  if (!availability.days || availability.days.length === 0) {
    return { success: false, error: "Select at least one available weekday." };
  }

  if (!availability.slots || availability.slots.length === 0) {
    return { success: false, error: "Add at least one dynamic time slot." };
  }

  const isEditing = Boolean(id);

  // 2. Password Validation
  if (!isEditing && !password) {
    return { success: false, error: "Password is required when adding a new doctor." };
  }

  if (password) {
    if (password !== confirmPassword) {
      return { success: false, error: "Passwords do not match." };
    }
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }
  }

  // 3. Ensure 'Doctors' sheet exists
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Doctors");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Doctors");
    sheet.appendRow(["id", "name", "speciality", "email", "phone", "password", "availabilityjson"]);
  }

  const cleanEmail = email.toString().trim().toLowerCase();
  const data = sheet.getDataRange().getValues();
  const availabilityJsonStr = JSON.stringify(availability);

  // 4. Duplicate Email Check (Excluding current doctor when editing)
  for (let i = 1; i < data.length; i++) {
    const rowId = data[i][0] ? data[i][0].toString().trim() : '';
    const rowEmail = data[i][3] ? data[i][3].toString().trim().toLowerCase() : '';

    if (rowEmail === cleanEmail && (!isEditing || rowId !== id)) {
      return { success: false, error: "A doctor with this email address already exists." };
    }
  }

  // 5. Update Existing or Append New Doctor
  if (isEditing) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === id) {
        const rowNumber = i + 1;
        // Retain current hashed password if no new password was provided
        const finalPasswordHash = password ? hashPassword(password) : data[i][5];

        sheet.getRange(rowNumber, 2).setValue(name.trim());
        sheet.getRange(rowNumber, 3).setValue(speciality.trim());
        sheet.getRange(rowNumber, 4).setValue(cleanEmail);
        sheet.getRange(rowNumber, 5).setValue(cleanPhone);
        sheet.getRange(rowNumber, 6).setValue(finalPasswordHash);
        sheet.getRange(rowNumber, 7).setValue(availabilityJsonStr);

        return { success: true, message: "Doctor record updated successfully.", docId: id };
      }
    }
    return { success: false, error: "Doctor record not found for update." };
  } else {
    const newId = "DOC" + (1000 + data.length);
    const hashedPassword = hashPassword(password);

    sheet.appendRow([
      newId,
      name.trim(),
      speciality.trim(),
      cleanEmail,
      cleanPhone,
      hashedPassword,
      availabilityJsonStr
    ]);

    return { success: true, message: "Doctor registered successfully.", docId: newId };
  }
}


function getDoctorByEmail(email) {
  // Tab to edit
  const doctor =  getDoctorsList().filter((doctor) => doctor.email === email)[0];
  console.log(JSON.stringify(doctor));
  return doctor
}