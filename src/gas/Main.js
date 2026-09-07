/**
 * Web App Entry Point serving single page application container.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Hospital Appointment System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
