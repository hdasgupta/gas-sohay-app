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
 * Utility: Validates password complexity requirements.
 * Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character.
 */
function validatePasswordComplexity(password) {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter (A-Z).";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter (a-z).";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number (0-9).";
  }
  if (!/[!@#$%^&*(),.?":{}|<>\-_=+\\|/\[\];']/.test(password)) {
    return "Password must contain at least one special character.";
  }
  return null;
}

/**
 * Saves or updates a doctor record in the 'Doctors' sheet.
 * Sheet Columns: ID | Name | Specialty | Email | Phone | Password | AvailabilityJSON
 */
function saveDoctor(payload) {
  const { id, name, specialty, email, phone, password, confirmPassword, availability } = payload;
  const isEditing = Boolean(id);

  // 1. Common Validation
  if (!name || !specialty) {
    return { success: false, error: "Doctor Name and Specialty are required." };
  }

  // Validate availability object contains at least one day with time slots
  if (!availability || typeof availability !== 'object' || Object.keys(availability).length === 0) {
    return { success: false, error: "Please configure availability for at least one weekday." };
  }

  let hasValidSlots = false;
  for (const day in availability) {
    if (Array.isArray(availability[day]) && availability[day].length > 0) {
      hasValidSlots = true;
      break;
    }
  }
  if (!hasValidSlots) {
    return { success: false, error: "Please add at least one time slot to your selected available days." };
  }


  // 2. Ensure 'Doctors' sheet exists with exact column names
  initDatabase();
  let sheet = getOrCreateSheet("Doctors");
  
  const data = sheet.getDataRange().getValues();
  const availabilityJsonStr = JSON.stringify(availability);

  // 3. Update Existing Doctor
  if (isEditing) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === id.toString().trim()) {
        const rowNumber = i + 1;

        // Preserve existing password if left blank, otherwise validate and hash
        let finalPasswordHash = data[i][5];
        if (password) {
          if (password !== confirmPassword) {
            return { success: false, error: "Passwords do not match." };
          }
          const pwdError = validatePasswordComplexity(password);
          if (pwdError) {
            return { success: false, error: pwdError };
          }
          finalPasswordHash = hashPassword(password);
        }

        // Update Name, Specialty, Password, AvailabilityJSON (Email Col 4 & Phone Col 5 remain untouched)
        sheet.getRange(rowNumber, 2).setValue(name.trim());
        sheet.getRange(rowNumber, 3).setValue(specialty.trim());
        sheet.getRange(rowNumber, 6).setValue(finalPasswordHash);
        sheet.getRange(rowNumber, 7).setValue(availabilityJsonStr);

        return { success: true, message: "Doctor record updated successfully.", docId: id };
      }
    }
    return { success: false, error: "Doctor ID not found for update." };
  }

  // 4. Create New Doctor
  if (!email || !phone || !password) {
    return { success: false, error: "Email, Phone, and Password are required for new doctors." };
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

  const pwdError = validatePasswordComplexity(password);
  if (pwdError) {
    return { success: false, error: pwdError };
  }

  const cleanEmail = email.toString().trim().toLowerCase();

  // Unique Check for Email and Phone
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

  // 5. Append Row
  const newId = "DOC" + (1000 + data.length);
  const hashedPassword = hashPassword(password);

  sheet.appendRow([
    newId,
    name.trim(),
    specialty.trim(),
    cleanEmail,
    cleanPhone,
    hashedPassword,
    availabilityJsonStr
  ]);

  return { success: true, message: "Doctor added successfully.", docId: newId };
}

/**
 * Removes a doctor record from the 'Doctors' sheet by ID.
 */
function deleteDoctor(docId) {
  if (!docId) {
    return { success: false, error: "Doctor ID is required." };
  }
  
  const sheet = getOrCreateSheet("Doctors");
  if (!sheet) {
    return { success: false, error: "Doctors sheet not found." };
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === docId.toString().trim()) {
      sheet.deleteRow(i + 1); // +1 because row index in Apps Script is 1-based
      return { success: true, message: "Doctor deleted successfully." };
    }
  }
  
  return { success: false, error: "Doctor ID not found." };
}

function getDoctorByEmail(email) {
  // Tab to edit
  const doctor =  getDoctorsList().filter((doctor) => doctor.email === email)[0];
  console.log(JSON.stringify(doctor));
  return doctor
}