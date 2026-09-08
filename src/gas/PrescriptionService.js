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
        power: data[i][1] ? data[i][1].toString().trim() : ''
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
 * Creates a formatted Google Doc Prescription and saves any new medicines to catalog.
 */
function createPrescriptionDoc(payload) {
  var docName = 'Prescription_' + payload.patientName.replace(/\s+/g, '_') + '_' + payload.date;
  var doc = DocumentApp.create(docName);
  var body = doc.getBody();

  body.setMarginTop(36).setMarginBottom(36).setMarginLeft(36).setMarginRight(36);

  // Header
  var orgTitle = body.appendParagraph(payload.orgName || 'HEALTHCARE MEDICAL CENTER');
  orgTitle.setHeading(DocumentApp.ParagraphHeading.HEADING1)
          .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
          .setBold(true);

  var subHeader = body.appendParagraph("Multispeciality Clinic & Digital Health Care\n----------------------------------------------------------------------------------------------------");
  subHeader.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  // Info Block
  var infoTable = body.appendTable([
    ['Dr. Name:', payload.doctorName, 'Date:', payload.date],
    ['Designation:', payload.doctorDesignation, 'Patient Name:', payload.patientName],
    ['', '', 'Patient Age:', payload.patientAge + ' Years']
  ]);
  infoTable.setBorderWidth(0);

  body.appendParagraph("\nRx / Prescribed Medications").setBold(true).setFontSize(14);

  // Table Data
  var tableData = [['#', 'Medicine Name', 'Power / Dosage', 'Taking Time', 'Food Instruction']];

  for (var i = 0; i < payload.medicines.length; i++) {
    var med = payload.medicines[i];
    var times = Array.isArray(med.takingTime) ? med.takingTime.join(', ') : med.takingTime;
    tableData.push([
      (i + 1).toString(),
      med.name,
      med.power,
      times,
      med.foodInstruction
    ]);

    // Save newly prescribed medicine into the Medicines sheet for future autocompletion
    saveMedicineToMaster(med.name, med.power);
  }

  var medTable = body.appendTable(tableData);
  medTable.getRow(0).setBold(true);

  for (var cellIdx = 0; cellIdx < 5; cellIdx++) {
    medTable.getRow(0).getCell(cellIdx).setBackgroundColor('#F1F5F9');
  }

  body.appendParagraph("\n\n\n\n");
  var sigPara = body.appendParagraph("_______________________\nSignature of Doctor\n" + payload.doctorName);
  sigPara.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

  doc.saveAndClose();

  var file = DriveApp.getFileById(doc.getId());
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Log in Prescriptions sheet
  var pSheet = getOrCreateSheet('Prescriptions');
  pSheet.appendRow([
    'RX-' + new Date().getTime(),
    payload.doctorName,
    payload.patientName,
    payload.patientAge,
    payload.date,
    doc.getUrl()
  ]);

  return {
    success: true,
    docUrl: doc.getUrl()
  };
}
