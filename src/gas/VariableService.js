const variables = getVariables();

function getVariables() {
  return Object.fromEntries(getAllData ("Variables"));
}

function setVariable(name, value) {
  var sheet = getOrCreateSheet("Variables")
  var data = getAllData("Variables");
  for(let i=0; i<data.length; i++) {
    if(data[i][0] === name) {
      sheet.getRange(i+2, 2).setValue(value)
      break;
    }
  }
}