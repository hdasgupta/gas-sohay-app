import React, { useState, useEffect, useRef } from 'react';
import './MessageBox.css';

/**
 * Full-width MessageBox Component with dynamic animated progress line
 * 
 * @param {string|React.ReactNode} message - Notification text or node content
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - Alert style variant
 * @param {number} [duration=3000] - Time in milliseconds before auto-dismissal
 * @param {function} [onClose] - Callback when timer ends or close button is clicked
 */
export default function MessageBox({
  message,
  type = 'info',
  duration = 3000,
  onClose
}) {
  const [remainingTime, setRemainingTime] = useState(duration);
  //const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  const renderIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  useEffect(() => {
    //if (isPaused) {
    //  clearTimeout(timerRef.current);
    //} else {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        if (onClose) onClose();
      }, remainingTime);
    //}

    return () => clearTimeout(timerRef.current);
  }, [/*isPaused,*/ remainingTime, onClose]);

  const handleMouseEnter = () => {
    //setIsPaused(true);
    const elapsedTime = Date.now() - startTimeRef.current;
    setRemainingTime((prev) => Math.max(0, prev - elapsedTime));
  };

  const handleMouseLeave = () => {
    //setIsPaused(false);
  };

  return (
    <div
      className={`message-box ${type}`}
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

      <div
        key={message}
        className="progress-bar"
        style={{
          '--duration': `${duration}ms`,
          animationPlayState:/* isPaused ? 'paused' :*/ 'running'
        }}
      />
    </div>
  );
}
