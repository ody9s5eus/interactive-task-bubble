import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

interface TrashZoneProps {
  isHovered: boolean;
}

export const TrashZone = forwardRef<HTMLDivElement, TrashZoneProps>(
  ({ isHovered }, ref) => {
    return (
      <div
        ref={ref}
        className="absolute bottom-4 right-4 z-40 pointer-events-none"
      >
        <motion.div
          animate={{
            scale: isHovered ? 1.2 : 1,
            rotate: isHovered ? -10 : 0,
            color: isHovered ? '#ef4444' : '#9ca3af',
          }}
          className="bg-white/80 backdrop-blur-sm p-4 rounded-full shadow-lg border-2 border-transparent transition-colors duration-200"
          style={{
             borderColor: isHovered ? '#ef4444' : 'transparent'
          }}
        >
          <Trash2 size={32} />
        </motion.div>
      </div>
    );
  }
);

TrashZone.displayName = 'TrashZone';
