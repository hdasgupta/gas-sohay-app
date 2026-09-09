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
 * Main backend function called by callBackend('createPrescriptionDoc', [payload])
 */
function createPrescriptionDoc(payload) {
  try {
    if (!payload || !payload.patientName || !payload.medicines) {
      throw new Error("Invalid or missing prescription payload.");
    }

    // 1. Create a new Google Document
    var docName = "Prescription_" + sanitizeFileName(payload.patientName) + "_" + payload.date;
    var doc = DocumentApp.create(docName);
    var body = doc.getBody();

    // Set standard document margins (0.5 inch / 36 pt)
    body.setMarginTop(36);
    body.setMarginBottom(36);
    body.setMarginLeft(36);
    body.setMarginRight(36);

    // 2. Add Clinic / Hospital Header
    var clinicHeader = body.appendParagraph((payload.orgName || 'CITY HEALTHCARE CLINIC').toUpperCase());
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

    // Add Horizontal Line Divider
    body.appendHorizontalRule();

    // 3. Add Patient Details Box
    var patientTableData = [
      [
        "Patient: " + payload.patientName,
        "Age: " + payload.patientAge + " yrs",
        "Date: " + payload.date
      ]
    ];
    var patientTable = body.appendTable(patientTableData);
    patientTable.setBorderWidth(0); // Borderless for clean layout
    
    // Format Patient Table Row
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

    body.appendParagraph("").setFontSize(8); // Spacer

    // 4. Rx Heading
    var rxHeader = body.appendParagraph("Rx (Prescribed Medicines)");
    rxHeader.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    rxHeader.setFontSize(14);
    rxHeader.setBold(true);
    rxHeader.setForegroundColor("#2563EB");

    // 5. Medicines Table Header & Data
    var headers = ["#", "Medicine Name", "Qty / Dose", "Timing", "Instruction"];
    var tableData = [headers];

    if (Array.isArray(payload.medicines)) {
      payload.medicines.forEach(function(med, index) {
        // Compose Timing Column Text
        var timingList = Array.isArray(med.takingTime) ? med.takingTime.join(", ") : "";
        var timingText = "";

        if (med.isSos) {
          timingText = timingList ? "SOS (" + timingList + ")" : "SOS (As Needed)";
        } else {
          timingText = timingList || "As Directed";
        }

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

    // Style Medicines Table Header Row
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

    // Style Medicines Table Content Rows
    for (var r = 1; r < medTable.getNumRows(); r++) {
      var row = medTable.getRow(r);
      var rowBg = (r % 2 === 0) ? "#F8FAFC" : "#FFFFFF"; // Alternating row color
      
      for (var c = 0; c < row.getNumChildren(); c++) {
        var cell = row.getCell(c);
        cell.setBackgroundColor(rowBg);
        cell.setPaddingTop(6);
        cell.setPaddingBottom(6);
        
        var cellPara = cell.getChild(0).asParagraph();
        cellPara.setFontSize(10);
        cellPara.setForegroundColor("#1E293B");

        // Highlight SOS tag if present in the Timing column
        if (c === 3 && cellPara.getText().indexOf("SOS") !== -1) {
          cellPara.setBold(true);
          cellPara.setForegroundColor("#B45309"); // Dark Amber
        }
      }
    }

    // Adjust Table Column Widths (approximate)
    medTable.setColumnWidth(0, 30);  // #
    medTable.setColumnWidth(1, 200); // Name
    medTable.setColumnWidth(2, 90);  // Quantity
    medTable.setColumnWidth(3, 110); // Timing
    medTable.setColumnWidth(4, 90);  // Instruction

    // 6. Signature Footer
    body.appendParagraph("\n\n\n\n");
    var sigPara = body.appendParagraph("_____________________________________\nSignature / Stamp");
    sigPara.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    sigPara.setFontSize(10);
    sigPara.setForegroundColor("#64748B");

    // Save & Close Document
    doc.saveAndClose();

    return {
      success: true,
      docUrl: doc.getUrl(),
      docId: doc.getId()
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
 * Helper to sanitize filenames
 */
function sanitizeFileName(name) {
  return String(name).replace(/[^a-zA-Z0-9_-]/g, "_");
}


function getPatientMasterList() {
  return [
    { name: "Rahul Das", age: 34 },
    { name: "Suman Ganguly", age: 45 },
    { name: "Priya Sharma", age: 28 },
    { name: "Amit Roy", age: 52 }
  ];
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
          age: ageIdx !== -1 && row[ageIdx] ? row[ageIdx].toString().trim() : ''
        });
      }
    }
  }

  return patients;
}
