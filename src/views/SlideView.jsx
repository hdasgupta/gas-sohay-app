import React, { useState, useEffect } from 'react';
import './SlideView.css';

const SlideView = ({ activeKey, children }) => {
  const [currentKey, setCurrentKey] = useState(activeKey);
  const [prevKey, setPrevKey] = useState(null);

  useEffect(() => {
    if (activeKey !== currentKey) {
      setPrevKey(currentKey);
      setCurrentKey(activeKey);
    }
  }, [activeKey, currentKey]);

  const handleAnimationEnd = (key) => {
    if (key === prevKey) {
      setPrevKey(null);
    }
  };

  return (
    <div className="slide-view-wrapper">
      {React.Children.map(children, (child) => {
        if (!child) return null;
        const key = child.key;

        const isCurrent = key === currentKey;
        const isPrev = key === prevKey;

        // Do not render items that are neither current nor exiting
        if (!isCurrent && !isPrev) return null;

        const isTransitioning = prevKey !== null;
        let animationClass = 'active';

        if (isTransitioning) {
          animationClass = isCurrent ? 'slide-in-left' : 'slide-out-right';
        }

        return (
          <div
            key={key}
            className={`slide-item ${animationClass}`}
            onAnimationEnd={() => handleAnimationEnd(key)}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};

export default SlideView;