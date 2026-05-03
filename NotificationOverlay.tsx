import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export function NotificationOverlay() {
  const { activeNotification, setActiveNotification } = useAuth();

  if (!activeNotification) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
        onClick={() => setActiveNotification(null)}
      >
        <div className="relative w-full h-full flex flex-col items-center justify-center">
            <img src={activeNotification.backgroundUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" />
            <h2 className="relative text-4xl font-bold text-white mb-4">{activeNotification.title}</h2>
            <button 
                onClick={() => setActiveNotification(null)}
                className="relative bg-white text-black px-6 py-3 rounded-full font-bold"
            >
                إغلاق
            </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
