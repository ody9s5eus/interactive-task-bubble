import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface InputOverlayProps {
  onAddTask: (text: string) => void;
}

export const InputOverlay = ({ onAddTask }: InputOverlayProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTask(text.trim());
      setText('');
      // Keep open for multiple entries or close? "Mobile keyboard" stays open usually until dismissed.
      // But user might want to see the bubble.
      // Let's keep it open for now, maybe just clear text.
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none z-50 flex flex-col justify-end items-center">
      <AnimatePresence>
        {isOpen && (
          <motion.form
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-2 flex gap-2 pointer-events-auto mb-20"
          >
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="New Task..."
              className="flex-1 px-4 py-3 bg-transparent rounded-xl outline-none text-lg text-gray-800 placeholder-gray-500 font-medium"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="bg-blue-600/90 hover:bg-blue-700/90 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Plus size={24} />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <motion.button
        layout
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'pointer-events-auto shadow-2xl rounded-full p-4 text-white transition-colors',
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-black hover:bg-gray-800'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <X size={32} /> : <Plus size={32} />}
      </motion.button>
    </div>
  );
};
