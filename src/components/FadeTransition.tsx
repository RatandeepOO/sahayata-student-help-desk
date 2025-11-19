'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeTransitionProps {
  children: ReactNode;
  duration?: number;
}

export default function FadeTransition({ children, duration = 0.5 }: FadeTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration }}
    >
      {children}
    </motion.div>
  );
}
