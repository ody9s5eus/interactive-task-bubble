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
          'absolute flex items-center justify-center text-center rounded-full shadow-lg select-none p-4 font-bold text-white leading-tight break-words pointer-events-none backdrop-blur-md border border-white/30 overflow-hidden'
        )}
        style={{
          width: r * 2,
          height: r * 2,
        }}
      >
        {/* Background layer with opacity */}
        <div
           className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent"
           style={{ backgroundColor: color, opacity: 0.8 }}
        />

        {/* Shine effect */}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_4px_20px_rgba(255,255,255,0.5)] pointer-events-none" />

        <span className="pointer-events-none z-10 drop-shadow-md text-shadow-sm">
          {task.text}
        </span>
      </motion.div>
    );
  }
);

Bubble.displayName = 'Bubble';
