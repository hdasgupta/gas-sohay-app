import React from 'react';
import './SlideView.css';

/**
 * Custom wrapper component that animates children from left on view change
 * @param {string|number} activeKey - Unique identifier of the current view
 * @param {React.ReactNode} children - The view component to render
 */
export default function SlideView({ activeKey, children }) {
  return (
    <div className="slide-view-wrapper">
      <div key={activeKey} className="slide-in-left">
        {children}
      </div>
    </div>
  );
}
