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
        jwt: 'eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtZjA1YTA2YzZiNmE0NDI3YTg0MjdhYzU4ZmRhZmI5YmQvNTZlM2I5LVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3ODk1MDI1ODcsImV4cCI6MTc4OTUwOTc4NywibmJmIjoxNzg5NTAyNTgyLCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtZjA1YTA2YzZiNmE0NDI3YTg0MjdhYzU4ZmRhZmI5YmQiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsImZpbGUtdXBsb2FkIjp0cnVlLCJvdXRib3VuZC1jYWxsIjp0cnVlLCJzaXAtb3V0Ym91bmQtY2FsbCI6ZmFsc2UsInRyYW5zY3JpcHRpb24iOnRydWUsImxpc3QtdmlzaXRvcnMiOnRydWUsInJlY29yZGluZyI6dHJ1ZSwiZmxpcCI6ZmFsc2V9LCJ1c2VyIjp7ImhpZGRlbi1mcm9tLXJlY29yZGVyIjpmYWxzZSwibW9kZXJhdG9yIjp0cnVlLCJuYW1lIjoiaGltYWdobmEuZGFzZ3VwdGEiLCJpZCI6Imdvb2dsZS1vYXV0aDJ8MTEwMDIyNjM1Nzk3MDA2NzMyMDQ1IiwiYXZhdGFyIjoiIiwiZW1haWwiOiJoaW1hZ2huYS5kYXNndXB0YUBnbWFpbC5jb20ifX0sInJvb20iOiIqIn0.gJS-mNGlAp9okpLphzVcGSmgHAzI36tzAWOOB2fnrz08B8fKuJBFWOHtSwTjSl02G1CigMsDURlmv1ozpWdRgn-a4E1lv_ucD10Gz0kH0Xb6aYmKPWq5aHV7EtNkDTHf3-6iDC7T1y8I88gd68APPga_FeY5F84pxz1rRUKPXWEV1cGJrPNlQP6a8EgKL_lkaC9EtL4bCfykc65RraundY32TpXDZsYL_ed5u48Q1OqaVRhp9-o9ZSUrJmsdtRsfRWRA19MVh46kfBNYjngb9paxwtKyiTf7dqY3wpn_HLZbpXKu3ZreJ0TfyikiTi5Gj1SmnZEK1jf_zA87tsvfMw?', 
        width: '100%',
        height: '600px',
        parentNode: containerRef.current,
        userInfo: { email: userEmail, displayName: userName },
        configOverwrite: { startWithAudioMuted: false,
        disableDeepLinking: true,
          startWithVideoMuted: false
        }
      };
      
      apiInstance = new window.JitsiMeetExternalAPI('8x8.vc', options);
      const iframe = apiInstance.getIFrame();
      iframe.setAttribute('allow', 'camera *; microphone *; display-capture *; autoplay *; clipboard-write *');
      
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
      </div> 
    <div ref = { containerRef } style = { { border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' } }
    /> 
    </div>
  );
}