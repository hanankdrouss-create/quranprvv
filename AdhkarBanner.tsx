import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ADHKAR_MORNING, ADHKAR_EVENING } from '../constants';

export function AdhkarBanner() {
  const [adhkar, setAdhkar] = useState<string>('');
  const { showNotification } = useAuth();

  useEffect(() => {
    const updateAdhkar = () => {
      const hour = new Date().getHours();
      let selectedAdhkar = '';
      if (hour >= 4 && hour < 12) {
        selectedAdhkar = ADHKAR_MORNING[Math.floor(Math.random() * ADHKAR_MORNING.length)];
      } else {
        selectedAdhkar = ADHKAR_EVENING[Math.floor(Math.random() * ADHKAR_EVENING.length)];
      }
      setAdhkar(selectedAdhkar);
      showNotification('أذكار اليوم', selectedAdhkar);
    };
    updateAdhkar();
  }, []); // تشغيل مرة واحدة عند التحميل

  if (!adhkar) return null;

  return (
    <div className="bg-brand-gold/10 p-4 rounded-xl border border-brand-gold/20 mt-4 mx-4">
      <p className="text-brand-dark dark:text-brand-gold-light text-sm text-center font-arabic leading-relaxed">
        {adhkar}
      </p>
    </div>
  );
}
