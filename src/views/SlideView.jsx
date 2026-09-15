import React, { useState } from 'react';
import './SlideView.css';

const SlideView = ({ activeKey, children }) => {
  // Sync transition state during render to avoid 1-frame useEffect lag
  const [state, setState] = useState({ current: activeKey, prev: null });

  if (activeKey !== state.current) {
    setState({
      current: activeKey,
      prev: state.current,
    });
  }

  // Strip React internal `.$` prefix from child keys
  const getCleanKey = (child) => {
    if (!child || child.key === null || child.key === undefined) return null;
    return String(child.key).replace(/^\.\$/, '');
  };

  const handleAnimationEnd = (key) => {
    if (key === state.prev) {
      setState((prev) => ({ ...prev, prev: null }));
    }
  };

  return (
    <div className="slide-view-container">
      {React.Children.map(children, (child) => {
        if (!child) return null;

        const childKey = getCleanKey(child);
        const isCurrent = childKey === String(state.current);
        const isPrev = childKey === String(state.prev);

        // Keep only active and exiting children mounted
        if (!isCurrent && !isPrev) return null;

        const isAnimating = state.prev !== null;
        let animClass = 'slide-static';

        if (isAnimating) {
          animClass = isCurrent ? 'slide-in-left' : 'slide-out-right';
        }

        return (
          <div
            key={childKey}
            className={`slide-item ${animClass}`}
            onAnimationEnd={() => handleAnimationEnd(childKey)}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};

export default SlideView;