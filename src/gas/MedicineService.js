/**
 * Loads a remote CSV file in parallel byte chunks using UrlFetchApp.fetchAll
 * @param {string} url - Direct link to the remote CSV file
 * @param {number} chunkSizeMB - Size of each chunk in Megabytes (default 5MB)
 * @returns {Array<Array<string>>} Parsed 2D array of CSV rows
 */
function loadCSVInParallel(url, chunkSizeMB = 5) {
  // 1. Get file size via HEAD request
  const headResponse = UrlFetchApp.fetch(url, { method: 'head', muteHttpExceptions: true });
  const headers = headResponse.getHeaders();
  const contentLength = parseInt(headers['Content-Length'] || headers['content-length'], 10);

  if (!contentLength || isNaN(contentLength)) {
    throw new Error('Server did not return Content-Length or HTTP Range is not supported.');
  }

  const chunkSize = chunkSizeMB * 1024 * 1024;
  const requests = [];

  // 2. Build HTTP Range request objects
  for (let start = 0; start < contentLength; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, contentLength - 1);
    requests.push({
      url: url,
      method: 'get',
      headers: { Range: `bytes=${start}-${end}` },
      muteHttpExceptions: true
    });
  }

  // 3. Fetch all chunks in parallel on Google servers
  const responses = UrlFetchApp.fetchAll(requests);
  const chunkTexts = responses.map(res => res.getContentText('UTF-8'));

  // 4. Assemble chunks & fix line splits across boundaries
  return assembleAndParseGAS(chunkTexts);
}

/**
 * Reconstructs split lines and converts raw text chunks into a 2D array.
 */
function assembleAndParseGAS(chunkTexts) {
  let leftover = '';
  const fullRows = [];

  for (let i = 0; i < chunkTexts.length; i++) {
    const currentSegment = leftover + chunkTexts[i];
    const lastNewlineIndex = currentSegment.lastIndexOf('\n');

    if (lastNewlineIndex !== -1) {
      const completeText = currentSegment.slice(0, lastNewlineIndex);
      leftover = currentSegment.slice(lastNewlineIndex + 1);

      // Parse line-by-line (or use Utilities.parseCsv on the complete block)
      const parsedBlock = Utilities.parseCsv(completeText);
      fullRows.push(...parsedBlock);
    } else {
      leftover = currentSegment;
    }
  }

  // Parse remaining tail fragment if exists
  if (leftover.trim().length > 0) {
    const finalParsed = Utilities.parseCsv(leftover);
    fullRows.push(...finalParsed);
  }

  return fullRows;
}


/**
 * Safely fetches the medicine catalog, initializing headers if the sheet is empty.
 */
function getMedicineMasterList() {

  const url = 'https://raw.githubusercontent.com/junioralive/Indian-Medicine-Dataset/refs/heads/main/DATA/updated_indian_medicine_data.csv';
  

  const data = loadCSVInParallel(url).slice(1); // Returns [[col1, col2], [col1, col2]]
  
  // Access data fields directly
  Logger.log(data);


  return data.map((medicine) => medicine[1]);
}
