/**
 * Resolves room details and indicates whether the requesting email is the assigned recorder.
 */
function getRoomDetails(roomId, userEmail) {
  // Example: Retrieve room details from a Google Sheet database
  
  const data = getAllData("Appointments");
  
  let hostEmail = "";
  for (let i = 0; i < data.length; i++) {
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

/**
 * Generates an automated authentication token to bypass Jitsi login prompts.
 */
function getJitsiAuthToken(roomId, userEmail, userName, isModerator) {
  const appId = "vpaas-magic-cookie-f05a06c6b6a4427a8427ac58fdafb9bd"; // Obtain free from jaas.8x8.vc
  const apiKeyAppId = "vpaas-magic-cookie-f05a06c6b6a4427a8427ac58fdafb9bd/d541c4";
  
  const header = { alg: "RS256", typ: "JWT", kid: apiKeyAppId };
  const payload = {
    aud: "jitsi",
    iss: "chat",
    sub: appId,
    room: roomId,
    context: {
      user: {
        name: userName,
        email: userEmail,
        id: userEmail,
        moderator: isModerator ? "true" : "false"
      },
      features: {
        recording: "true",
        livestreaming: "true"
      }
    },
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // Valid for 1 hour
  };

  // Construct JWT
  const encodedHeader = Utilities.base64EncodeWebSafe(JSON.stringify(header));
  const encodedPayload = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  const unsignedToken = encodedHeader + "." + encodedPayload;
  
  // Note: For official JaaS, sign using your private key via Utilities.computeRsaSha256Signature
  return unsignedToken; 
}
