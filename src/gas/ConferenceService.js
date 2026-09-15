/**
 * Resolves room details and indicates whether the requesting email is the assigned recorder.
 */
function getRoomDetails(roomId, userEmail) {
  // Example: Retrieve room details from a Google Sheet database
  const sheet = getOrCreateSheet("Appointments");
  const data = sheet.getDataRange().getValues();
  
  let hostEmail = "";
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === roomId) { // Column A: Room ID
      hostEmail = data[i][2];   // Column B: Recorder/Host Email
      break;
    }
  }

  return {
    roomId: roomId,
    isRecorder: (userEmail.toLowerCase() === hostEmail.toLowerCase())
  };
}

/**
 * Saves recorded video stream to Google Drive.
 */
function saveMeetingVideoToDrive(base64Data, fileName, folderId) {
  try {
    const contentType = base64Data.substring(5, base64Data.indexOf(';'));
    const base64Content = base64Data.split(',')[1];
    const decodedBytes = Utilities.base64Decode(base64Content);
    const blob = Utilities.newBlob(decodedBytes, contentType, fileName);

    const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
    const file = folder.createFile(blob);
    
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return { success: true, fileId: file.getId(), fileUrl: file.getUrl() };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
