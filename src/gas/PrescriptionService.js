/**
 * Safely fetches the medicine catalog, initializing headers if the sheet is empty.
 */
function getMedicineMasterList() {
  initDatabase();
  var sheet = getOrCreateSheet('Medicines');
  
  // Initialize headers if sheet is totally blank
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Name', 'Power']);
    return [];
  }

  var data = sheet.getDataRange().getValues();
  var medicines = [];

  // Skip header row
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() !== '') {
      medicines.push({
        name: data[i][0].toString().trim(),
        
      });
    }
  }
  return medicines;
}

/**
 * Saves a new medicine to the master 'Medicines' sheet if it doesn't already exist.
 */
function saveMedicineToMaster(name, power) {
  if (!name) return;
  initDatabase();
  var sheet = getOrCreateSheet('Medicines');
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Name', 'Power']);
  }

  var data = sheet.getDataRange().getValues();
  var exists = false;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().toLowerCase() === name.toLowerCase()) {
      exists = true;
      break;
    }
  }

  if (!exists) {
    sheet.appendRow([name, power || '']);
  }
}


/**
 * Main backend function to generate prescription doc and attach link to appointment
 */
function createPrescriptionDoc(payload) {
  try {
    if (!payload || !payload.patientName || !payload.medicines) {
      throw new Error("Invalid or missing prescription payload.");
    }

    var doctorEmail = (payload.doctorEmail || Session.getActiveUser().getEmail() || "").toLowerCase().trim();
    var patientEmail = (payload.patientEmail || "").toLowerCase().trim();

    // 1. Locate the latest appointment for this Doctor & Patient
    var appointmentInfo = null;
    if (patientEmail && doctorEmail) {
      appointmentInfo = findLatestAppointment(doctorEmail, patientEmail);
    }

    // 2. Check if an existing prescription link exists and requires override confirmation
    if (appointmentInfo && appointmentInfo.prescriptionUrl && !payload.overrideConfirmed) {
      return {
        success: false,
        requiresConfirmation: true,
        appointmentDate: appointmentInfo.date,
        appointmentTime: appointmentInfo.time,
        message: "A prescription is already attached to the appointment on " + 
                 appointmentInfo.date + " at " + appointmentInfo.time + 
                 ". Do you want to replace/override it?"
      };
    }

    // 3. Create Google Doc
    var docName = "Prescription_" + sanitizeFileName(payload.patientName) + "_" + payload.date;
    var doc = DocumentApp.create(docName);
    var body = doc.getBody();

    body.setMarginTop(36);
    body.setMarginBottom(36);
    body.setMarginLeft(36);
    body.setMarginRight(36);

    // Header
    var clinicHeader = body.appendParagraph((payload.orgName || 'WEST BENGAL FORUM FOR MENTAL HEALTH').toUpperCase());
    clinicHeader.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    clinicHeader.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    clinicHeader.setFontSize(16);
    clinicHeader.setBold(true);
    clinicHeader.setForegroundColor("#1E3A8A");

    var doctorDetails = body.appendParagraph(
      (payload.doctorName || 'Dr. Doctor') + "\n" +
      (payload.doctorDesignation || payload.doctorSpeciality || '')
    );
    doctorDetails.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    doctorDetails.setFontSize(10);
    doctorDetails.setForegroundColor("#475569");

    body.appendHorizontalRule();

    // Patient Details
    var patientTableData = [
      [
        "Patient: " + payload.patientName,
        "Age: " + payload.patientAge + " yrs",
        "Date: " + payload.date
      ]
    ];
    var patientTable = body.appendTable(patientTableData);
    patientTable.setBorderWidth(0);

    var patientRow = patientTable.getRow(0);
    for (var p = 0; p < patientRow.getNumChildren(); p++) {
      var pCell = patientRow.getCell(p);
      pCell.setBackgroundColor("#F8FAFC");
      pCell.setPaddingTop(8);
      pCell.setPaddingBottom(8);
      var pPara = pCell.getChild(0).asParagraph();
      pPara.setFontSize(10);
      pPara.setBold(true);
      pPara.setForegroundColor("#334155");
    }

    body.appendParagraph("").setFontSize(8);

    // Prescription Section
    var rxHeader = body.appendParagraph("Rx (Prescribed Medicines)");
    rxHeader.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    rxHeader.setFontSize(14);
    rxHeader.setBold(true);
    rxHeader.setForegroundColor("#2563EB");

    var headers = ["#", "Medicine Name", "Qty / Dose", "Timing", "Instruction"];
    var tableData = [headers];

    if (Array.isArray(payload.medicines)) {
      payload.medicines.forEach(function(med, index) {
        var timingList = Array.isArray(med.takingTime) ? med.takingTime.join(", ") : "";
        var timingText = med.isSos 
          ? (timingList ? "SOS (" + timingList + ")" : "SOS (As Needed)")
          : (timingList || "As Directed");

        tableData.push([
          (index + 1).toString(),
          med.name || "-",
          med.quantity || "1 pcs",
          timingText,
          med.foodInstruction || "-"
        ]);
      });
    }

    var medTable = body.appendTable(tableData);
    medTable.setBorderColor("#CBD5E1");
    medTable.setBorderWidth(1);

    var headerRow = medTable.getRow(0);
    for (var i = 0; i < headerRow.getNumChildren(); i++) {
      var headerCell = headerRow.getCell(i);
      headerCell.setBackgroundColor("#2563EB");
      headerCell.setPaddingTop(8);
      headerCell.setPaddingBottom(8);
      var headPara = headerCell.getChild(0).asParagraph();
      headPara.setForegroundColor("#FFFFFF");
      headPara.setBold(true);
      headPara.setFontSize(10);
    }

    for (var r = 1; r < medTable.getNumRows(); r++) {
      var row = medTable.getRow(r);
      var rowBg = (r % 2 === 0) ? "#F8FAFC" : "#FFFFFF";
      for (var c = 0; c < row.getNumChildren(); c++) {
        var cell = row.getCell(c);
        cell.setBackgroundColor(rowBg);
        cell.setPaddingTop(6);
        cell.setPaddingBottom(6);
        var cellPara = cell.getChild(0).asParagraph();
        cellPara.setFontSize(10);
        cellPara.setForegroundColor("#1E293B");

        if (c === 3 && cellPara.getText().indexOf("SOS") !== -1) {
          cellPara.setBold(true);
          cellPara.setForegroundColor("#B45309");
        }
      }
    }

    medTable.setColumnWidth(0, 30);
    medTable.setColumnWidth(1, 200);
    medTable.setColumnWidth(2, 90);
    medTable.setColumnWidth(3, 110);
    medTable.setColumnWidth(4, 90);

    body.appendParagraph("\n\n\n\n");
    var sigPara = body.appendParagraph("_____________________________________\nSignature / Stamp");
    sigPara.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    sigPara.setFontSize(10);
    sigPara.setForegroundColor("#64748B");

    doc.saveAndClose();

    // 4. Update the prescription link in the Appointments Google Sheet
    if (appointmentInfo && appointmentInfo.rowIndex) {
      updateAppointmentPrescriptionUrl(appointmentInfo.rowIndex, doc.getUrl());
    }
    
    const docId = doc.getId();

const file = DriveApp.getFileById(docId);


var fileName = file.getName();

// 2. Identify target folder (same folder as the original document)
var parents = file.getParents();
var folder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();

// 3. Convert document to PDF
var pdfBlob = file.getAs('application/pdf');
pdfBlob.setName(fileName + '.pdf');

// 4. Save the PDF file in Google Drive
var pdfFile = folder.createFile(pdfBlob);
Logger.log('PDF created successfully: ' + pdfFile.getName());
pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
// 5. Delete the original Google Doc
// Standard DriveApp method (Moves to Trash - permanently purged after 30 days):
// file.setTrashed(true);

// Note: To permanently delete immediately bypassing Trash, enable "Drive API" 
// under Services in Apps Script and use:
Drive.Files.remove(file.getId());

return {
  success: true,
  docUrl: pdfFile.getUrl(),
  docId: pdfFile.getId(), 
  appointmentUpdated: !!(appointmentInfo && appointmentInfo.rowIndex)
};

    
  } catch (err) {
    Logger.log("Error generating prescription doc: " + err.toString());
    return {
      success: false,
      error: err.toString()
    };
  }
}

/**
 * Searches the 'Appointments' sheet for the latest record matching doctor and patient emails.
 * Column indices assumed:
 * Col A (1): Appointment ID
 * Col B (2): Patient Email
 * Col C (3): Doctor Email
 * Col D (4): Date (YYYY-MM-DD)
 * Col E (5): Time (HH:MM AM/PM)
 * Col F (6): Prescription Link
 */
function findLatestAppointment(doctorEmail, patientEmail) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null; // No rows or header only

  var latestAppt = null;
  var latestTimestamp = -1;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var pEmail = String(row[1] || "").toLowerCase().trim();
    var dEmail = String(row[2] || "").toLowerCase().trim();

    if (pEmail === patientEmail && dEmail === doctorEmail) {
      var apptDate = row[3];
      var apptTime = row[4];
      
      // Calculate timestamp for comparison
      var parsedDate = new Date(apptDate + " " + apptTime);
      var timestamp = isNaN(parsedDate.getTime()) ? i : parsedDate.getTime();

      if (timestamp >= latestTimestamp) {
        latestTimestamp = timestamp;
        latestAppt = {
          rowIndex: i + 1, // 1-based index in Sheet
          date: String(apptDate),
          time: String(apptTime),
          prescriptionUrl: row[5] ? String(row[5]).trim() : ""
        };
      }
    }
  }

  return latestAppt;
}

/**
 * Updates Column F (Prescription Link) in the 'Appointments' sheet for the given row.
 */
function updateAppointmentPrescriptionUrl(rowIndex, docUrl) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  if (sheet && rowIndex > 1) {
    sheet.getRange(rowIndex, 6).setValue(docUrl); // Column F
  }
}

function sanitizeFileName(name) {
  return String(name).replace(/[^a-zA-Z0-9_-]/g, "_");
}



/**
 * Fetches patient records directly from the 'Users' sheet.
 * Automatically filters by 'Patient' role if a Role column is present.
 */
function getPatientMasterList() {
  initDatabase();
  var sheet = getOrCreateSheet('Users');
  var lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { 
    return h.toString().toLowerCase().trim(); 
  });

  // Dynamic column detection
  var nameIdx = headers.indexOf('name');
  var ageIdx = headers.indexOf('age');
  var emailIdx = headers.indexOf('email');
  var roleIdx = headers.indexOf('role');

  // Fallback to column 0 if header naming varies
  if (nameIdx === -1) nameIdx = 0;

  var patients = [];
  var seen = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var name = row[nameIdx] ? row[nameIdx].toString().trim() : '';
    var role = roleIdx !== -1 && row[roleIdx] ? row[roleIdx].toString().trim().toLowerCase() : '';

    // Include row if name is present and role is 'patient' (or if no role column exists)
    if (name && (roleIdx === -1 || role === 'patient' || role === '')) {
      var key = name.toLowerCase();
      if (!seen[key]) {
        seen[key] = true;
        patients.push({
          name: name,
          email:row[emailIdx].toString().trim(), 
          age: ageIdx !== -1 && row[ageIdx] ? row[ageIdx].toString().trim() : ''
        });
      }
    }
  }

  return patients;
}
