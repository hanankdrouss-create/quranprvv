import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-emerald flex flex-col items-center justify-center p-6 text-center text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-8xl mb-8">🕌</div>
        <h1 className="text-4xl font-arabic font-bold mb-4">أهلاً بك</h1>
        <p className="text-lg opacity-90 mb-12 font-arabic">تطبيقك المتكامل لجميع احتياجاتك الإسلامية.</p>
        
        <button
          onClick={() => navigate('/home')}
          className="px-8 py-4 bg-brand-gold text-brand-dark rounded-full font-bold shadow-lg hover:bg-brand-gold-light transition-all text-lg font-arabic"
        >
          ابدأ الآن
        </button>
      </motion.div>
    </div>
  );
}
