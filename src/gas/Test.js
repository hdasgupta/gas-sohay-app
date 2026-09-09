function testAppointment() {
  // Tab to edit
  bookAppointment({
    userName: "Himaghna Dasgupta",
      userEmail: "himaghna.dasgupta@gmail.com",
      userPhone: "8017391410",
      doctorName: "Dr. Smith",
      doctorEmail: "test@doctors.com",
      date: "\"2026-09-07\"",
      time: "\"09:00\""
  })
}

function testCreatePrescription() {
  // Tab to edit
  const doc = createPrescriptionDoc(
    {
      patientName: "Himaghna Dasgupta",
      date: "2026-09-09", 
      orgName: "West bengal forum for mental health", 
      doctorName: "Priyanka Maity", 
      doctorDesignation: "Neuropsychiatist", 
      patientAge: "40", 
      medicines: [
        {
          takingTime: [
            "Breakfast",
            "Dinner"
          ], 
          name: "Becosules Z", 
          power: "1000 mg", 
          foodInstruction: "After food"
        }
        
      ]
    }
  );
  console.log(JSON.stringify(doc, null, 4));
}

function testUserAppountments() {
  // Tab to edit
  getUserAppointments("himaghna.dasgupta@gmail.com") 
}