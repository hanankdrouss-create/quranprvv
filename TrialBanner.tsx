import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

export const TrialBanner = () => {
  const { profile, activateTrial } = useAuth();
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  useEffect(() => {
    if (!profile || profile.role !== 'vip' || !profile.trialExpiry) return;

    const expiry = profile.trialExpiry?.toDate ? profile.trialExpiry.toDate() : (profile.trialExpiry instanceof Date ? profile.trialExpiry : new Date(profile.trialExpiry));

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiry.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft('انتهت الفترة التجريبية');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [profile]);
  
  if (!profile || profile.role === 'admin') return null;

  if (profile.role === 'vip') {
    return (
       <div className="bg-brand-emerald text-brand-gold p-4 rounded-xl flex items-center justify-between gap-4 shadow-lg mb-4 mx-4 border border-brand-gold/20">
         <div className="flex items-center gap-3">
            <Star className="text-brand-gold" />
            <p className="font-bold text-sm" dir="rtl">
                عضويتك المميزة تنتهي خلال: {timeLeft}
            </p>
         </div>
       </div>
    )
  }

  if (profile.trialUsed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-brand-gold text-brand-dark p-4 rounded-xl flex items-center justify-between gap-4 shadow-lg mb-4 mx-4"
    >
      <div className="flex items-center gap-3">
         <Star className="text-brand-dark" />
         <p className="font-bold text-sm">احصل على فترة تجريبية VIP لمدة 24 ساعة!</p>
      </div>
      <button
        onClick={activateTrial}
        className="bg-brand-dark text-brand-gold px-4 py-2 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-all"
      >
        تفعيل الآن
      </button>
    </motion.div>
  );
};
