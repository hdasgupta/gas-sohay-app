export const callBackend = (fn, args = [], cb) => {
  if (typeof google !== 'undefined' && google.script) {
    google.script.run
    .withFailureHandler((e) => alert(JSON.stringify(e))) 
    .withSuccessHandler(cb)[fn](...args);
  }
};
