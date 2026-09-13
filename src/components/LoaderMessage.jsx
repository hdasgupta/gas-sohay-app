import React from 'react';
import './LoaderMessage.css';

/**
 * Full-width LoaderMessage Component
 * 
 * @param {string|React.ReactNode} [message='Loading, please wait...'] - Loading text content
 * @param {'center'|'left'|'right'} [align='center'] - Content alignment within full-width container
 * @param {string} [iconColor] - Custom color for the SVG hourglass icon
 * @param {string} [className=''] - Additional CSS classes
 * @param {object} [style={}] - Custom inline CSS styles
 */
export default function LoaderMessage({
  message = 'Loading, please wait...',
  align = 'center',
  iconColor,
  className = '',
  style = {}
}) {
  return (
    <div
      className={`loader-message-container align-${align} ${className}`}
      style={style}
    >
      <svg
        className="hourglass-icon"
        style={iconColor ? { color: iconColor } : undefined}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 22h14" />
        <path d="M5 2h14" />
        <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
        <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
      </svg>
      <span className="loader-text">{message}</span>
    </div>
  );
}
