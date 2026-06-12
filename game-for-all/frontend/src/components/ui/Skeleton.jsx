import { motion } from 'framer-motion';
import React from 'react';

export function Skeleton({ className = '', style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1,
        ease: "easeInOut"
      }}
      className={`bg-white/10 rounded-lg ${className}`}
      style={style}
    />
  );
}
