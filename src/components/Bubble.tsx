import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Task } from '../types';

interface BubbleProps {
  task: Task;
  r: number; // Radius
  color: string;
}

export const Bubble = forwardRef<HTMLDivElement, BubbleProps>(
  ({ task, r, color }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        // pointer-events-none allows clicks to pass through to the canvas (Matter.MouseConstraint)
        className={clsx(
          'absolute flex items-center justify-center text-center rounded-full shadow-lg select-none p-4 font-bold text-white leading-tight break-words pointer-events-none backdrop-blur-sm border border-white/20 overflow-hidden'
        )}
        style={{
          width: r * 2,
          height: r * 2,
          // We remove direct background color here to use the layer below or just use rgba if we had it.
          // Using a separate div is cleaner for opacity control without affecting text.
        }}
      >
        {/* Background layer with opacity */}
        <div
           className="absolute inset-0 rounded-full"
           style={{ backgroundColor: color, opacity: 0.8 }}
        />

        <span className="pointer-events-none z-10 drop-shadow-md">
          {task.text}
        </span>
      </motion.div>
    );
  }
);

Bubble.displayName = 'Bubble';
