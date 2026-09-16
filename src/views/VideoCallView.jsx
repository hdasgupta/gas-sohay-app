import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

export default function VideoCallView({ key }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

  useEffect(() => {
    // 1. Get Camera & Microphone streams directly
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;

        // 2. AUTO-START RECORDING programmatically (No button click needed)
        startAutoRecording(stream);

        // 3. Initialize free PeerJS client (no login required)
        const peer = new Peer(); 

        peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            remoteVideoRef.current.srcObject = remoteStream;
          });
        });
      });
  }, []);

  const startAutoRecording = (stream) => {
    recordedChunks.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };

    mediaRecorder.onstop = saveToGoogleDrive;

    // Start immediately without waiting for user action
    mediaRecorder.start(1000); 
    mediaRecorderRef.current = mediaRecorder;
  };

  const saveToGoogleDrive = () => {
    const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      // Send directly to Google Apps Script backend to save in Drive
      if (window.google?.script?.run) {
        window.google.script.run.saveVideoToDrive(base64Data, "auto-recording.webm");
      }
    };
  };

  return (
    <div key={key}>
      <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px' }} />
      <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px' }} />
    </div>
  );
}
