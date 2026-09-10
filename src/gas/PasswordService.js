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