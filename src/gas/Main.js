/**
 * Web App Entry Point serving single page application container.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Sohay App')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
