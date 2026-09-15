import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SlideView = ({ activeKey, children }) => {
  const activeChild = React.Children.toArray(children).find(
    (child) => child.key === activeKey
  );

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence initial={false}>
        <motion.div
          key={activeKey}
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '-100%', position: 'absolute', top: 0, left: 0, width: '100%' }}
          transition={{ duration: 0.3 }}
        >
          {activeChild}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SlideView;