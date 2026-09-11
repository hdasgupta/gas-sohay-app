/**
 * Validates email existence in 'Users' or 'Doctors' sheet and sends 6-digit OTP.
 */
function sendPasswordResetOtp(email) {
  if (!email) {
    return { success: false, error: "Email address is required." };
  }

  const cleanEmail = email.trim().toLowerCase();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userFound = false;

  // Search in 'Users' sheet
  const usersSheet = ss.getSheetByName("Users");
  if (usersSheet) {
    const data = usersSheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().toLowerCase().trim());
    const emailColIdx = headers.indexOf("email") !== -1 ? headers.indexOf("email") : 1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][emailColIdx] && data[i][emailColIdx].toString().trim().toLowerCase() === cleanEmail) {
        userFound = true;
        break;
      }
    }
  }

  // Search in 'Doctors' sheet if not found in Users
  if (!userFound) {
    const doctorsSheet = ss.getSheetByName("Doctors");
    if (doctorsSheet) {
      const data = doctorsSheet.getDataRange().getValues();
      const headers = data[0].map(h => h.toString().toLowerCase().trim());
      const emailColIdx = headers.indexOf("email") !== -1 ? headers.indexOf("email") : 1;

      for (let i = 1; i < data.length; i++) {
        if (data[i][emailColIdx] && data[i][emailColIdx].toString().trim().toLowerCase() === cleanEmail) {
          userFound = true;
          break;
        }
      }
    }
  }

  if (!userFound) {
    return { success: false, error: "No user or doctor account found with this email." };
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP in CacheService for 10 minutes (600 seconds)
  const cache = CacheService.getScriptCache();
  cache.put("RESET_OTP_" + cleanEmail, otp, 600);

  // Send Email with OTP
  try {
    MailApp.sendEmail({
      to: cleanEmail,
      subject: "Password Reset Verification Code - Sohay App",
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #334155; font-size: 14px;">Use the following OTP code to reset your account password:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #2563eb; background: #eff6ff; padding: 12px; text-align: center; border-radius: 6px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #64748b;">This code is valid for 10 minutes. If you did not initiate this request, please ignore this email.</p>
        </div>
      `
    });

    return { success: true, message: "OTP sent successfully to your email." };
  } catch (err) {
    return { success: false, error: "Failed to send email: " + err.toString() };
  }
}

/**
 * Validates OTP and updates hashedpassword in Users or Doctors sheet.
 */
function resetPasswordWithOtp(email, otp, newPassword, confirmPassword) {
  if (!email || !otp || !newPassword || !confirmPassword) {
    return { success: false, error: "All fields are required." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New password and Confirm password do not match." };
  }

  if (newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cache = CacheService.getScriptCache();
  const cachedOtp = cache.get("RESET_OTP_" + cleanEmail);

  if (!cachedOtp || cachedOtp !== otp.trim()) {
    return { success: false, error: "Invalid or expired OTP code." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hashedPassword = hashPassword(newPassword);
  let isUpdated = false;

  // Helper to update password column in a sheet
  const updateSheetPassword = (sheetName) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return false;

    const headers = data[0].map(h => h.toString().toLowerCase().trim());
    const emailIdx = headers.indexOf("email") !== -1 ? headers.indexOf("email") : 1;
    
    // Find hashedpassword column, fallback to password
    let passIdx = headers.indexOf("hashedpassword");
    if (passIdx === -1) passIdx = headers.indexOf("password");
    if (passIdx === -1) passIdx = 2; // Default fallback column index

    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIdx] && data[i][emailIdx].toString().trim().toLowerCase() === cleanEmail) {
        sheet.getRange(i + 1, passIdx + 1).setValue(hashedPassword);
        return true;
      }
    }
    return false;
  };

  // Check and update in 'Users' sheet
  isUpdated = updateSheetPassword("Users");

  // If not found in Users, check and update in 'Doctors' sheet
  if (!isUpdated) {
    isUpdated = updateSheetPassword("Doctors");
  }

  if (!isUpdated) {
    return { success: false, error: "Account could not be located to update password." };
  }

  // Clear valid OTP from cache after successful reset
  cache.remove("RESET_OTP_" + cleanEmail);

  return {
    success: true,
    message: "Password reset successful! You can now login with your new password."
  };
}
