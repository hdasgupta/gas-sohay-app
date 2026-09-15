import React, { useEffect, useRef, useState } from 'react';

export default function SingleRecorderJitsi({ key, roomId, userEmail, userName, isRecorder = false, driveFolderId }) {
  const containerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);
  
  const [status, setStatus] = useState(isRecorder ? 'Recorder Mode: Standby' : 'Standard Participant Mode');
  
  useEffect(() => {
    let apiInstance = null;
    
    const script = document.createElement('script');
    script.src = 'https://8x8.vc/vpaas-magic-cookie-f05a06c6b6a4427a8427ac58fdafb9bd/external_api.js';
    script.async = true;
    script.onload = () => {
      const options = {
        roomName: 'vpaas-magic-cookie-f05a06c6b6a4427a8427ac58fdafb9bd/'+roomId,
        jwt: 'eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtZjA1YTA2YzZiNmE0NDI3YTg0MjdhYzU4ZmRhZmI5YmQvNTZlM2I5LVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3ODk1MDIzOTAsImV4cCI6MTc4OTUwOTU5MCwibmJmIjoxNzg5NTAyMzg1LCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtZjA1YTA2YzZiNmE0NDI3YTg0MjdhYzU4ZmRhZmI5YmQiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsImZpbGUtdXBsb2FkIjp0cnVlLCJvdXRib3VuZC1jYWxsIjp0cnVlLCJzaXAtb3V0Ym91bmQtY2FsbCI6ZmFsc2UsInRyYW5zY3JpcHRpb24iOnRydWUsImxpc3QtdmlzaXRvcnMiOmZhbHNlLCJyZWNvcmRpbmciOnRydWUsImZsaXAiOmZhbHNlfSwidXNlciI6eyJoaWRkZW4tZnJvbS1yZWNvcmRlciI6ZmFsc2UsIm1vZGVyYXRvciI6dHJ1ZSwibmFtZSI6ImhpbWFnaG5hLmRhc2d1cHRhIiwiaWQiOiJnb29nbGUtb2F1dGgyfDExMDAyMjYzNTc5NzAwNjczMjA0NSIsImF2YXRhciI6IiIsImVtYWlsIjoiaGltYWdobmEuZGFzZ3VwdGFAZ21haWwuY29tIn19LCJyb29tIjoiKiJ9.I08NxcXu3yOWGrq_X304LnhijCUQeH8UhG3fEAYX6vNL1M8dbWPdU5eCwkW4cMIMz9ulJ4KfMU1HMKK--OfbBKa4vIEmqwH2r2hC2dK0QxiU_6prmyzA4ostQ1T3CfIgl31fQKXRQcr1x48SUMZirLlGbnw-iN_0zTHdAVlo2znQrUaQGIb2H1bIdDkBQjE-n5GpMidPaVFHd2XYQLBgUVPJeC3DlXT232dWrBmvzWxyI9fNIPBJuGhf6gKdJ9jXRCW-e2gRq-hIoB3DRB74vDF5VzwqpIuBA0NGujWkP-u2CtiFNsOvvWJjB4zOlfEcxaza5nJtDZAvD0bB7QrWGw', 
        width: '100%',
        height: '600px',
        parentNode: containerRef.current,
        userInfo: { email: userEmail, displayName: userName },
        configOverwrite: { startWithAudioMuted: false, disableDeepLinking: true }
      };
      
      apiInstance = new window.JitsiMeetExternalAPI('8x8.vc', options);
      
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
    <div key={key} style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
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