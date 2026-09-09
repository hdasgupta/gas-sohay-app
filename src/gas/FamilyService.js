/**
 * Creates a new family and assigns the primary user as the first member.
 */
function createFamily(payload) {
  initDatabase()
  const { familyName, userEmail } = payload;
  const sheet = getOrCreateSheet("Families");
  const patientSheet = getOrCreateSheet("Users");
  
  if (!sheet) throw new Error("Families sheet not found.");

  // Check if user already belongs to a family
  const existingFamily = getFamilyDetailsByUser(userEmail);
  if (existingFamily && existingFamily.familyId) {
    return { success: false, error: "User already belongs to a family." };
  }

  const familyId = "FAM-" + Math.floor(100000 + Math.random() * 900000);
  
  // Save family record [familyId, familyName, primaryEmail, createdAt]
  sheet.appendRow([familyId, familyName, userEmail, new Date().toISOString()]);

  // Link primary patient to family
  assignPatientToFamily(userEmail, familyId);

  return { success: true, familyId, familyName };
}

/**
 * Adds a patient member to an existing family.
 * Constraint: A patient can belong to at most one family.
 */
function addFamilyMember(payload) {
  const { familyId, memberEmail } = payload;
  const patientSheet = getOrCreateSheet("Users");
  const data = patientSheet.getDataRange().getValues();
  
  let patientRowIndex = -1;
  let currentFamilyId = "";

  // Column index assumptions: 1=Name, 3=Email, 7=FamilyId
  for (let i = 1; i < data.length; i++) {
    if (data[i][3].toString().toLowerCase() === memberEmail.toLowerCase()) {
      patientRowIndex = i + 1;
      currentFamilyId = data[i][7] || "";
      break;
    }
  }

  if (patientRowIndex === -1) {
    return { success: false, error: "Patient with this email does not exist." };
  }

  if (currentFamilyId && currentFamilyId.trim() !== "") {
    return { success: false, error: "Patient already belongs to a family." };
  }

  // Update patient's familyId column (Column 8 / H)
  patientSheet.getRange(patientRowIndex, 8).setValue(familyId);

  return { success: true };
}

/**
 * Retrieves family information and member list for a given user email.
 */
function getFamilyDetailsByUser(userEmail) {
  const patientSheet = getOrCreateSheet("Users");
  const familySheet = getOrCreateSheet("Families");
  
  if (!patientSheet) return null;

  const patientData = patientSheet.getDataRange().getValues();
  let userFamilyId = "";

  for (let i = 1; i < patientData.length; i++) {
    if (patientData[i][3].toString().toLowerCase() === userEmail.toLowerCase()) {
      userFamilyId = patientData[i][7] || "";
      break;
    }
  }

  if (!userFamilyId) return null;

  // Get family details
  let familyName = "";
  if (familySheet) {
    const familyData = familySheet.getDataRange().getValues();
    for (let i = 1; i < familyData.length; i++) {
      if (familyData[i][0] === userFamilyId) {
        familyName = familyData[i][1];
        break;
      }
    }
  }

  // Fetch all members with this familyId
  const members = [];
  for (let i = 1; i < patientData.length; i++) {
    if (patientData[i][7] === userFamilyId) {
      members.push({
        name: patientData[i][1],
        email: patientData[i][3]
      });
    }
  }

  return { familyId: userFamilyId, familyName, members };
}

function assignPatientToFamily(email, familyId) {
  const patientSheet = getOrCreateSheet("Users");
  const data = patientSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3].toString().toLowerCase() === email.toLowerCase()) {
      patientSheet.getRange(i + 1, 8).setValue(familyId);
      break;
    }
  }
}
