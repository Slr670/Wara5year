import React, { useEffect } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

export function AnimatedCounter({ value, duration = 1, className = '', prefix = '', suffix = '' }) {
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    damping: 30,
    stiffness: 100,
    duration: duration * 1000
  });

  const [displayValue, setDisplayValue] = React.useState('0');

  useEffect(() => {
    motionVal.set(Number(value) || 0);
  }, [value, motionVal]);

  useEffect(() => {
    return springVal.on('change', (latest) => {
      setDisplayValue(Math.round(latest).toLocaleString('th-TH'));
    });
  }, [springVal]);

  return (
    <span className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
