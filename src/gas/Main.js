/**
 * Web App Entry Point serving single page application container.
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  
  template.roomId = e.pathInfo||undefined;
  
  return template
    .evaluate()
    .setTitle('Sohay App')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
