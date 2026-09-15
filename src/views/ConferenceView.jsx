import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';

export default function ConferenceView({ key, appointmentId, user, styles = {} }) {
  return (
    <SingleRecorderJitsi 
      key={kkey}
      roomId={appointmentId}
      isRecorder={user.role === "doctor"}
      userEmail={user.email}
      userName={user.name}
      driveFolderId={window.videoFolderId}
    />
  )
}