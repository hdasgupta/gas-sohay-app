import React, { useEffect, useRef, useState } from 'react';

export default function SingleRecorderJitsi({ roomId, userEmail, userName, isRecorder = false, driveFolderId }) {
  const containerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);
  
  const [status, setStatus] = useState(isRecorder ? 'Recorder Mode: Standby' : 'Standard Participant Mode');
  
  useEffect(() => {
    let apiInstance = null;
    
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      const options = {
        roomName: roomId,
        width: '100%',
        height: '600px',
        parentNode: containerRef.current,
        userInfo: { email: userEmail, displayName: userName },
        configOverwrite: { startWithAudioMuted: false, disableDeepLinking: true }
      };
      
      apiInstance = new window.JitsiMeetExternalAPI('meet.jit.si', options);
      
      // ACTIVE ONLY FOR DESIGNATED RECORDER
      if (isRecorder) {
        apiInstance.addEventListener('videoConferenceJoined', async () => {
          setStatus('Recorder Mode: Auto-recording active in background...');
          await autoStartRecording();
        });
        
        apiInstance.addEventListener('videoConferenceLeft', () => {
          setStatus('Recorder Mode: Call ended. Uploading to Google Drive...');
          autoStopAndUpload();
        });
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (apiInstance) apiInstance.dispose();
      document.body.removeChild(script);
    };
  }, [roomId, userEmail, userName, isRecorder]);
  
  const autoStartRecording = async () => {
    try {
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "browser" },
          audio: true // Captures tab audio (all participants' voices)
        });

      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      
      mediaRecorder.start();
    } catch (err) {
      console.error('Auto-record failed:', err);
      setStatus('Recording error: Camera/Microphone access required.');
    }
  };
  
  const autoStopAndUpload = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    
    setTimeout(() => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64Data = reader.result;
        const fileName = `Room_${roomId}_${userName}_${Date.now()}.webm`;
        
        if (window.google && window.google.script) {
          window.google.script.run
            .withSuccessHandler((res) => {
              if (res.success) {
                setStatus(`Video saved to Google Drive! (File ID: ${res.fileId})`);
              } else {
                setStatus(`Upload failed: ${res.error}`);
              }
            })
            .saveMeetingVideoToDrive(base64Data, fileName, driveFolderId);
        } else {
          setStatus('Executed outside GAS environment (Local Testing)');
        }
      };
    }, 500);
  };
  
  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ 
        padding: '8px 12px', 
        marginBottom: '8px', 
        background: isRecorder ? '#f0fdf4' : '#f9fafb', 
        border: `1px solid ${isRecorder ? '#bbf7d0' : '#e5e7eb'}`, 
        borderRadius: '4px', 
        fontSize: '13px', 
        color: isRecorder ? '#15803d' : '#374151' 
      }}>
        <strong>Status:</strong> {status}
      </div> <
    div ref = { containerRef } style = { { border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' } }
    /> <
    /div>
  );
}