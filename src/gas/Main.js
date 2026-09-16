
 /**
 * Web App Entry Point serving single page application container.
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  
  template.serverData = {
    roomId: e.parameter.appointmentId||undefined, 
    ...variables
  }
  /*
  try {
  const token = getJitsiAuthToken(roomId, userEmail, userName, isModerator);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    token: token
  })).setMimeType(ContentService.MimeType.JSON);
  
} catch (error) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: error.message
  })).setMimeType(ContentService.MimeType.JSON);
}*/
  
  return template
    .evaluate()
    .setTitle('Sohay App')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
