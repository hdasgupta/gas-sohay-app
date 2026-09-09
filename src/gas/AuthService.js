/**
 * Hashes a plain-text password using SHA-256.
 * @param {string} password Plain-text password string.
 * @return {string} Hex-encoded SHA-256 hash.
 */
function hashPassword(password) {
  if (!password) return '';
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  
  // Convert byte array to hexadecimal string
  return rawHash.map(function(byte) {
    const hex = (byte < 0 ? byte + 256 : byte).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
 
 
/**
 * Validates credentials across Users and Doctors sheets.
 */
function authenticateUser(email, password) {
  initDatabase();
  
  // Check Users (Patients & Admins)
  var sheet = getOrCreateSheet('Users');
  const cleanEmail = email.toString().trim().toLowerCase();
  const inputHash = hashPassword(password);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowEmail = data[i][3] ? data[i][1].toString().trim().toLowerCase() : '';
    const storedHash = data[i][5] ? data[i][2].toString().trim() : '';

    if (rowEmail === cleanEmail) {
      // Compare calculated hash against stored hash
      if (storedHash === inputHash) {
        return {
          success: true,
          user: { 
            id: users[i][0], 
            name: users[i][1], 
            location: users[i][2], 
            email: users[i][3], 
            phone: users[i][4], 
            role: users[i][6] 
          
          }
        };
      } else {
        return { success: false, error: "Invalid email or password." };
      }
    }
  }

  return { success: false, error: "Invalid email or password." };

  
  }


/**
 * Generates and emails a 6-digit OTP code to the patient, stored in cache for 10 minutes.
 */
function sendOtp(email) {
  if (!email) return { success: false, message: 'Email address is required.' };

  var otp = Math.floor(100000 + Math.random() * 900000).toString();
  var cache = CacheService.getScriptCache();
  cache.put('OTP_' + email, otp, 600); // 10 minute expiration

  MailApp.sendEmail({
    to: email,
    subject: 'Verification Code - Sohay App',
    htmlBody: `<h3>Email Verification</h3><p>Your OTP code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`
  });

  return { success: true, message: 'OTP sent to your email.' };
}

/**
 * Verifies the provided OTP code against the script cache.
 */
function verifyOtp(email, otp) {
  var cache = CacheService.getScriptCache();
  var storedOtp = cache.get('OTP_' + email);

  if (storedOtp && storedOtp === otp) {
    cache.put('VERIFIED_' + email, 'TRUE', 900); // Mark email as verified for 15 minutes
    return { success: true, message: 'Email verified successfully!' };
  }
  return { success: false, message: 'Invalid or expired OTP code.' };
}

/**
 * Registers a patient after checking OTP verification and password complexity.
 */
function registerPatient(data) {
  initDatabase();
  var cache = CacheService.getScriptCache();
  var isVerified = cache.get('VERIFIED_' + data.email);

  if (!isVerified) {
    return { success: false, message: 'Please verify your email via OTP before registering.' };
  }

  // Server-side password policy validation
  var passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|< me>]{8,}$/;
  if (!passRegex.test(data.password)) {
    return { success: false, message: 'Password does not meet complexity requirements.' };
  }

  var sheet = getOrCreateSheet('Users');
  var users = sheet.getDataRange().getValues();

  for (var i = 1; i < users.length; i++) {
    if (users[i][3] === data.email) return { success: false, message: 'Email is already registered.' };
  }

  var userId = 'USR-' + new Date().getTime();
  sheet.appendRow([userId, data.name, data.location, data.email, data.phone, hashPassword(data.password), 'patient']);

  return {
    success: true,
    user: { id: userId, name: data.name, location: data.location, email: data.email, phone: data.phone, role: 'patient' }
  };
}


function getPatientByEmail(email) {
  // Tab to edit
  var userSheet = getOrCreateSheet('Users');
  var users = userSheet.getDataRange().getValues();
  for (var i = 1; i < users.length; i++) {
    if (users[i][3] === email) {
      return {
         id: users[i][0], 
         name: users[i][1], 
         location: users[i][2], 
         email: users[i][3], 
         phone: users[i][4], 
         role: users[i][6] 
      };
    }
  }
}