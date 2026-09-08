/**
 * Fetches the master list of available medicines for auto-search/autocomplete.
 */
function getMedicineMasterList() {
  initDatabase();
  var sheet = getOrCreateSheet('Medicines');
  var data = sheet.getDataRange().getValues();
  var medicines = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      medicines.push({
        name: data[i][0],
        power: data[i][1] || ''
      });
    }
  }
  return medicines;
}

/**
 * Creates a formatted Google Doc Prescription and returns the access link.
 */
function createPrescriptionDoc(payload) {
  // payload: { orgName, orgLogoUrl, doctorName, doctorDesignation, patientName, patientAge, date, medicines }
  var docName = 'Prescription_' + payload.patientName.replace(/\s+/g, '_') + '_' + payload.date;
  var doc = DocumentApp.create(docName);
  var body = doc.getBody();

  // Page Setup (Margins)
  body.setMarginTop(36);
  body.setMarginBottom(36);
  body.setMarginLeft(36);
  body.setMarginRight(36);

  // 1. Organization Header
  var orgTitle = body.appendParagraph(payload.orgName || 'HEALTHCARE MEDICAL CENTER');
  orgTitle.setHeading(DocumentApp.ParagraphHeading.HEADING1)
          .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
          .setBold(true);

  var subHeader = body.appendParagraph("Multispeciality Clinic & Digital Health Care\nContact: +91 98765 43210 | Email: care@clinic.com\n----------------------------------------------------------------------------------------------------");
  subHeader.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  // 2. Doctor & Patient Info Block (Grid layout using a borderless table)
  var infoTable = body.appendTable([
    ['Dr. Name:', payload.doctorName, 'Date:', payload.date],
    ['Designation:', payload.doctorDesignation, 'Patient Name:', payload.patientName],
    ['', '', 'Patient Age:', payload.patientAge + ' Years']
  ]);
  infoTable.setBorderWidth(0);

  body.appendParagraph("\nRx / Prescribed Medications").setBold(true).setFontSize(14);

  // 3. Medicines Table
  var tableData = [
    ['#', 'Medicine Name', 'Power / Dosage', 'Taking Time', 'Food Instruction']
  ];

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
  }

  var medTable = body.appendTable(tableData);
  medTable.getRow(0).setBold(true);

  // Style header row
  for (var cellIdx = 0; cellIdx < 5; cellIdx++) {
    medTable.getRow(0).getCell(cellIdx).setBackgroundColor('#F1F5F9');
  }

  // 4. Footer & Digital Signature Line
  body.appendParagraph("\n\n\n\n");
  var sigPara = body.appendParagraph("_______________________\nSignature of Doctor\n" + payload.doctorName);
  sigPara.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

  doc.saveAndClose();

  // Make document viewable with link
  var file = DriveApp.getFileById(doc.getId());
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Automatically record prescription details in 'Prescriptions' sheet
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
    docUrl: doc.getUrl(),
    docId: doc.getId()
  };
}
