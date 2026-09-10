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
  const isEditing = Boolean(id);

  // 1. Mandatory Common Validations
  if (!name || !speciality || !availability) {
    return { success: false, error: "Name, speciality, and availability are required." };
  }

  if (!availability.days || availability.days.length === 0) {
    return { success: false, error: "Select at least one available weekday." };
  }

  if (!availability.slots || availability.slots.length === 0) {
    return { success: false, error: "Add at least one dynamic time slot." };
  }

  // 2. Ensure 'Doctors' sheet exists
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Doctors");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Doctors");
    sheet.appendRow(["id", "name", "speciality", "email", "phone", "password", "availabilityjson"]);
  }

  const data = sheet.getDataRange().getValues();
  const availabilityJsonStr = JSON.stringify(availability);

  // 3. Handle Doctor Update (Immutable Email & Phone)
  if (isEditing) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === id) {
        const rowNumber = i + 1;

        // Preserve existing password if left blank
        let finalPasswordHash = data[i][5];
        if (password) {
          if (password !== confirmPassword) {
            return { success: false, error: "Passwords do not match." };
          }
          if (password.length < 6) {
            return { success: false, error: "Password must be at least 6 characters long." };
          }
          finalPasswordHash = hashPassword(password);
        }

        // Update fields (Columns 4 & 5 for email and phone are explicitly untouched)
        sheet.getRange(rowNumber, 2).setValue(name.trim());
        sheet.getRange(rowNumber, 3).setValue(speciality.trim());
        sheet.getRange(rowNumber, 6).setValue(finalPasswordHash);
        sheet.getRange(rowNumber, 7).setValue(availabilityJsonStr);

        return { success: true, message: "Doctor record updated successfully. (Email & Phone preserved)", docId: id };
      }
    }
    return { success: false, error: "Doctor ID not found for update." };
  } 

  // 4. Handle New Doctor Creation
  if (!email || !phone || !password) {
    return { success: false, error: "Email, phone, and password are required for new doctors." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { success: false, error: "Invalid email address format." };
  }

  const cleanPhone = phone.toString().replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return { success: false, error: "Phone number must contain at least 10 digits." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const cleanEmail = email.toString().trim().toLowerCase();

  // Unique Email & Phone Check
  for (let i = 1; i < data.length; i++) {
    const rowEmail = data[i][3] ? data[i][3].toString().trim().toLowerCase() : '';
    const rowPhone = data[i][4] ? data[i][4].toString().replace(/\D/g, '') : '';

    if (rowEmail === cleanEmail) {
      return { success: false, error: "A doctor with this email address already exists." };
    }
    if (rowPhone === cleanPhone) {
      return { success: false, error: "A doctor with this phone number already exists." };
    }
  }

  // 5. Append New Doctor
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

function getDoctorByEmail(email) {
  // Tab to edit
  const doctor =  getDoctorsList().filter((doctor) => doctor.email === email)[0];
  console.log(JSON.stringify(doctor));
  return doctor
}