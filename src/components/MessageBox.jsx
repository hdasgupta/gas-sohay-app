import React, { useState, useEffect, useRef } from 'react';
import './MessageBox.css';

/**
 * MessageBox Component with animated progress countdown line
 * 
 * @param {string|React.ReactNode} message - Content message
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - Severity variant type
 * @param {number} [duration=3000] - Duration in milliseconds before auto-closing
 * @param {function} [onClose] - Callback function triggered on dismiss
 */
export default function MessageBox({
  message,
  type = 'info',
  duration = 3000,
  onClose, 
  style
}) {
  const [remainingTime, setRemainingTime] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  // Icon mapping helper
  const renderIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  // Timer logic synchronized with hover state
  useEffect(() => {
    if (isPaused) {
      clearTimeout(timerRef.current);
    } else {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        if (onClose) onClose();
      }, remainingTime);
    }

    return () => clearTimeout(timerRef.current);
  }, [isPaused, remainingTime, onClose]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    // Calculate remaining duration elapsed before pause
    const elapsedTime = Date.now() - startTimeRef.current;
    setRemainingTime((prev) => Math.max(0, prev - elapsedTime));
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div
      className={`message-box ${type}`}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="message-content">
        <span className="type-icon">{renderIcon()}</span>
        <span>{message}</span>
      </div>

      <button className="close-btn" onClick={onClose} aria-label="Close message">
        &times;
      </button>

      {/* Animated progress bar */}
      <div
        className="progress-bar"
        style={{
          '--duration': `${duration}ms`,
          animationPlayState: isPaused ? 'paused' : 'running'
        }}
      />
    </div>
  );
}
