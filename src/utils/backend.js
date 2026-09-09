// src/utils/backend.js

export function callBackend(functionName, args = [], callback) {
  try {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((response) => {
        if (callback) callback(response);
      })
      .withFailureHandler((err) => {
        console.error('Apps Script Error:', err);
        alert('Server error: ' + err.message);
      })[functionName](...args);
  } else {
    alert('Running outside Google Apps Script environment.');
  }
} catch(e) {
  alert(JSON.stingify(e)
}
}
