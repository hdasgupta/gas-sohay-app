import React, { useState, useEffect } from 'react';

export const SlideView = ({ activeKey, children }) => {
  const [currentKey, setCurrentKey] = useState(activeKey);
  const [prevKey, setPrevKey] = useState(null);

  useEffect(() => {
    if (activeKey !== currentKey) {
      setPrevKey(currentKey);
      setCurrentKey(activeKey);
    }
  }, [activeKey, currentKey]);

  const handleAnimationEnd = (key) => {
    // Unmount previous view only after its exit animation ends
    if (key === prevKey) {
      setPrevKey(null);
    }
  };

  return (
    <div className="slide-view-container">
      {React.Children.map(children, (child) => {
        if (!child) return null;
        const key = child.key;
        const isCurrent = key === currentKey;
        const isPrev = key === prevKey;

        // Render only current and exiting children
        if (!isCurrent && !isPrev) return null;

        const isAnimating = prevKey !== null;
        const statusClass = isCurrent
          ? isAnimating ? 'slide-in' : 'active'
          : 'slide-out';

        return (
          <div
            key={key}
            className={`slide-item ${statusClass}`}
            onAnimationEnd={() => handleAnimationEnd(key)}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
