import React, { useEffect, useRef, useCallback } from 'react';

export default function Captcha({ onCaptchaChange }) {
  const canvasRef = useRef(null);

  // Generate random 6-character alphanumeric string
  const generateCaptchaText = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  };

  // Draw distorted text and noise onto HTML5 Canvas
  const drawCaptcha = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const captchaText = generateCaptchaText();
    onCaptchaChange(captchaText);

    // Clear background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add random noise lines
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = ['#cbd5e1', '#94a3b8', '#64748b'][Math.floor(Math.random() * 3)];
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Add random background noise dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw characters with random rotation & offset
    ctx.font = 'bold 22px monospace';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < captchaText.length; i++) {
      const char = captchaText[i];
      const x = 18 + i * 22;
      const y = canvas.height / 2 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 30 - 15) * (Math.PI / 180);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = ['#0f172a', '#1e293b', '#2563eb', '#0284c7'][Math.floor(Math.random() * 4)];
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }, [onCaptchaChange]);

  useEffect(() => {
    drawCaptcha();
  }, [drawCaptcha]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <canvas
        ref={canvasRef}
        width={160}
        height={42}
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          userSelect: 'none',
          backgroundColor: '#f8fafc'
        }}
      />
      <button
        type="button"
        onClick={drawCaptcha}
        title="Refresh CAPTCHA"
        style={{
          padding: '8px 12px',
          background: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: '1'
        }}
      >
        🔄
      </button>
    </div>
  );
}
