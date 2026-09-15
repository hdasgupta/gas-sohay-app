import React, { useState, useEffect } from 'react';
import { callBackend } from '../utils/backend';
import SingleRecorderJitsi from '../components/SingleRecorderJitsi'

export default function ConferenceView({ key, appointmentId, user, styles = {} }) {
  return (
    <SingleRecorderJitsi 
      key={key}
      roomId={appointmentId}
      isRecorder={user.role === "doctor"}
      userEmail={user.email}
      userName={user.name}
      driveFolderId={window.videoFolderId}
    />
  )
}