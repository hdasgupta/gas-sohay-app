/**
 * Loads a remote CSV file in parallel byte chunks using UrlFetchApp.fetchAll
 * @param {string} url - Direct link to the remote CSV file
 * @param {number} chunkSizeMB - Size of each chunk in Megabytes (default 5MB)
 * @returns {Array<Array<string>>} Parsed 2D array of CSV rows
 */
function loadCSVInParallel(url, chunkSizeMB = 5) {
  // 1. Fetch only the first byte to inspect headers
  const probeResponse = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Range: 'bytes=0-0' },
    muteHttpExceptions: true
  });

  const headers = probeResponse.getHeaders();
  
  // Content-Range format is usually: "bytes 0-0/104857600"
  const contentRange = headers['Content-Range'] || headers['content-range'];
  let contentLength = 0;

  if (contentRange) {
    contentLength = parseInt(contentRange.split('/')[1], 10);
  } else {
    // Fallback if Content-Range isn't returned directly
    contentLength = parseInt(headers['Content-Length'] || headers['content-length'], 10);
  }

  if (!contentLength || isNaN(contentLength)) {
    throw new Error('Could not determine total file size. Server may not support HTTP Range requests.');
  }

  const chunkSize = chunkSizeMB * 1024 * 1024;
  const requests = [];

  // 2. Build HTTP Range request objects using 'get'
  for (let start = 0; start < contentLength; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, contentLength - 1);
    requests.push({
      url: url,
      method: 'get',
      headers: { Range: `bytes=${start}-${end}` },
      muteHttpExceptions: true
    });
  }

  // 3. Fetch all chunks in parallel
  const responses = UrlFetchApp.fetchAll(requests);
  const chunkTexts = responses.map(res => res.getContentText('UTF-8'));

  // 4. Assemble and parse
  return assembleAndParseGAS(chunkTexts);
}

/**
 * Reconstructs split lines and converts raw text chunks into a 2D array.
 */
/**
 * Reconstructs split lines and converts raw text chunks into a 2D array
 * without overflowing the call stack on large arrays.
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

      const parsedBlock = Utilities.parseCsv(completeText);
      
      // Use a standard loop instead of fullRows.push(...parsedBlock)
      for (let j = 0; j < parsedBlock.length; j++) {
        fullRows.push(parsedBlock[j]);
      }
    } else {
      leftover = currentSegment;
    }
  }

  // Parse remaining tail fragment if exists
  if (leftover.trim().length > 0) {
    const finalParsed = Utilities.parseCsv(leftover);
    for (let j = 0; j < finalParsed.length; j++) {
      fullRows.push(finalParsed[j]);
    }
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
  Logger.log(data.length);


  return data.map((medicine) => medicine[1]);
}
