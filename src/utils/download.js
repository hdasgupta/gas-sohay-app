import Papa from 'papaparse';

/**
 * Reconstructs sliced CSV lines across chunks and parses them into JSON objects/arrays.
 * @param {string[]} chunkTexts - Array of raw text responses from byte-range requests.
 * @returns {Array} Combined array of parsed CSV rows.
 */
function assembleAndParseChunks(chunkTexts) {
  let leftover = '';
  const allParsedRows = [];
  let headers = null;

  for (let i = 0; i < chunkTexts.length; i++) {
    // Combine leftover fragment from previous chunk with current text
    const currentSegment = leftover + chunkTexts[i];
    
    // Find the position of the last newline in this segment
    const lastNewlineIndex = currentSegment.lastIndexOf('\n');

    if (lastNewlineIndex !== -1) {
      // Extract all fully completed rows up to the newline
      const completeText = currentSegment.slice(0, lastNewlineIndex);
      
      // Store the broken/incomplete line after the newline for the next chunk
      leftover = currentSegment.slice(lastNewlineIndex + 1);

      // Parse complete lines
      const parsed = Papa.parse(completeText, {
        header: false, // Parse as arrays first to handle header mapping manually across chunks
        skipEmptyLines: true,
      });

      let rows = parsed.data;

      // Extract header from the very first chunk
      if (i === 0 && rows.length > 0) {
        headers = rows[0];
        rows = rows.slice(1); // Remove header row from data
      }

      // Map rows to objects using extracted headers
      if (headers) {
        const mappedRows = rows.map((row) =>
          headers.reduce((acc, currHeader, index) => {
            acc[currHeader] = row[index];
            return acc;
          }, {})
        );
        allParsedRows.push(...mappedRows);
      } else {
        allParsedRows.push(...rows);
      }
    } else {
      // If no newline found in current range, keep appending to leftover
      leftover = currentSegment;
    }
  }

  // Parse any remaining leftover fragment at the end of the file
  if (leftover.trim().length > 0) {
    const finalParsed = Papa.parse(leftover, {
      header: false,
      skipEmptyLines: true,
    });
    
    if (headers) {
      const mappedRows = finalParsed.data.map((row) =>
        headers.reduce((acc, currHeader, index) => {
          acc[currHeader] = row[index];
          return acc;
        }, {})
      );
      allParsedRows.push(...mappedRows);
    } else {
      allParsedRows.push(...finalParsed.data);
    }
  }

  return allParsedRows;
}

async function getFileChunks(url, chunkSizeMB = 10) {
  // Get total content length
  const headRes = await fetch(url, { method: 'HEAD' });
  const totalSize = parseInt(headRes.headers.get('content-length'), 10);
  const chunkSize = chunkSizeMB * 1024 * 1024;

  const ranges = [];
  for (let start = 0; start < totalSize; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, totalSize - 1);
    ranges.push({ start, end });
  }
  return ranges;
}

async function fetchChunk({ start, end }, url) {
  const response = await fetch(url, {
    headers: { Range: `bytes=${start}-${end}` },
  });
  return await response.text();
}

async function loadCSVInParallel(url) {
  const ranges = await getFileChunks(url, 10); // 10MB chunks
  
  // Fetch all chunks simultaneously
  const chunkTexts = await Promise.all(
    ranges.map((range) => fetchChunk(range, url))
  );

  // Combine/repair split lines across chunk boundaries before parsing
  return assembleAndParseChunks(chunkTexts);
}
