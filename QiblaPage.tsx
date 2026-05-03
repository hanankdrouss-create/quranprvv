import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Compass } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

import { LOCATIONS } from '../constants';

export default function QiblaPage() {
  const [heading, setHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const controls = useAnimation();
  const { profile } = useAuth();
  
  const selectedLocation = profile?.locationId || 'mecca';
  const currentLocationData = LOCATIONS.find(l => l.id === selectedLocation) || LOCATIONS[0];

  useEffect(() => {
    const fetchQibla = async () => {
      try {
        const res = await fetch(`https://api.aladhan.com/v1/qibla/${currentLocationData.lat}/${currentLocationData.lng}`);
        const data = await res.json();
        if (data.code === 200) {
          setQiblaDirection(data.data.direction);
        }
      } catch (e) {
        console.error("Failed to fetch Qibla from Aladhan API", e);
      }
    };
    fetchQibla();
  }, [currentLocationData]);

  useEffect(() => {
    // We simulate phone compass rotation here for preview.
    // In a real device, you'd use DeviceOrientation API to rotate the compass.
    // Here we will just point the compass to the true Qibla relative to North and wobble a bit.
    const interval = setInterval(() => {
      const baseHeading = qiblaDirection !== null ? qiblaDirection : 135;
      const wobble = Math.sin(Date.now() / 1000) * 8; // gentle wobble
      setHeading(baseHeading + wobble);
    }, 100);
    return () => clearInterval(interval);
  }, [qiblaDirection]);

  useEffect(() => {
    controls.start({ rotate: heading, transition: { type: 'spring', damping: 20 } });
  }, [heading, controls]);

  return (
    <div className="p-6 pt-[100px] pb-24 min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-brand-emerald-light/20 to-transparent pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 relative z-10">
        <h1 className="text-3xl font-arabic font-bold text-white mb-2">القبلة</h1>
        <p className="text-slate-400 text-sm mb-1">{currentLocationData.name}</p>
        <p className="text-brand-gold/80 text-xs">قم بتدوير الهاتف حتى يتطابق المؤشر مع الكعبة</p>
      </motion.div>

      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-[8px] border-brand-emerald-light shadow-2xl bg-brand-emerald" />
        
        {/* Decor */}
        <div className="absolute inset-4 rounded-full border border-dashed border-brand-gold/30 opacity-50" />
        
        {/* N / S / E / W markers */}
        <span className="absolute top-2 left-1/2 -translate-x-1/2 font-bold text-brand-gold/60">ش</span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-bold text-brand-gold/60">ج</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-brand-gold/60">ق</span>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-brand-gold/60">غ</span>

        {/* Compass Needle */}
        <motion.div 
          animate={controls}
          className="absolute w-full h-full flex flex-col items-center justify-center"
        >
          {/* Kaaba indicator */}
          <div className="absolute top-[10%] w-8 h-10 bg-[#020D06] border-2 border-brand-gold rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.5)] z-20 flex items-center justify-center">
            <div className="w-full h-[2px] bg-brand-gold absolute top-[20%]" />
          </div>
          
          <div className="w-1 h-32 bg-gradient-to-t from-transparent via-brand-gold/50 to-brand-gold relative z-10 pointer-events-none" />
          <div className="w-4 h-4 rounded-full bg-brand-gold border-4 border-[#020D06] shadow-md relative z-30 -mt-2" />
          <div className="w-1 h-32 bg-brand-emerald-light pointer-events-none" />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 bg-brand-emerald-light px-6 py-3 rounded-full shadow-lg border border-brand-gold/20 flex flex-col items-center gap-1"
      >
        <div className="flex items-center gap-3">
          <Compass className="text-brand-gold" />
          <span className="font-mono text-xl font-bold text-white">{qiblaDirection ? Math.round(qiblaDirection) : '--'}°</span>
        </div>
        <span className="text-xs text-slate-400 font-arabic">اتجاه القبلة من الشمال</span>
      </motion.div>
    </div>
  );
}
