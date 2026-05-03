import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, MapPin, Volume2, Check, X, Loader2, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import clsx from 'clsx';
import { Howl } from 'howler';

const MUEZZINS = [
  { id: 'ali_mulla', name: 'علي أحمد ملا', location: 'المسجد الحرام', audioUrl: 'https://cdn.aladhan.com/audio/adhans/a9.mp3' },
  { id: 'essam_bukhari', name: 'عصام بخاري', location: 'المسجد النبوي', audioUrl: 'https://cdn.aladhan.com/audio/adhans/a1.mp3', isPremium: true },
  { id: 'abdulbasit', name: 'عبدالباسط عبدالصمد', location: 'مصر', audioUrl: 'https://cdn.aladhan.com/audio/adhans/a2.mp3', isPremium: true },
  { id: 'mishary', name: 'مشاري العفاسي', location: 'الكويت', audioUrl: 'https://cdn.aladhan.com/audio/adhans/a9.mp3', isPremium: true },
  { id: 'mansour_zahrani', name: 'منصور الزهراني', location: 'السعودية', audioUrl: 'https://cdn.aladhan.com/audio/adhans/a1.mp3' },
];

import { AdhkarBanner } from '../components/AdhkarBanner';
import { LOCATIONS } from '../constants';

const PRAYER_NAMES: Record<string, string> = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
  none: 'الفجر'
};

const PRAYER_KEYS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function formatTimeLeft(ms: number) {
  if (ms <= 0) return '00:00:00';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function HomePage() {
  const [time, setTime] = useState(new Date());
  const [isMuezzinModalOpen, setIsMuezzinModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const soundRef = useRef<Howl | null>(null);
  const [playingMuezzinId, setPlayingMuezzinId] = useState<string | null>(null);
  
  const { profile, updateMuezzin, updateLocation, user, t } = useAuth();
  
  const [selectedVoice, setSelectedVoice] = useState(profile?.muezzinId || 'ali_mulla');
  const [selectedLocation, setSelectedLocation] = useState(profile?.locationId || 'mecca');

  const [apiTimes, setApiTimes] = useState<Record<string, string> | null>(null);
  const [apiTimesTomorrow, setApiTimesTomorrow] = useState<Record<string, string> | null>(null);
  const [isLoadingTimes, setIsLoadingTimes] = useState(true);

  useEffect(() => {
    if (profile?.muezzinId) setSelectedVoice(profile.muezzinId);
    if (profile?.locationId) setSelectedLocation(profile.locationId);
  }, [profile?.muezzinId, profile?.locationId]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentLocationData = LOCATIONS.find(l => l.id === selectedLocation) || LOCATIONS[0];

  useEffect(() => {
    const fetchTimes = async () => {
      setIsLoadingTimes(true);
      try {
        const todayStr = `${time.getDate()}-${time.getMonth() + 1}-${time.getFullYear()}`;
        const tomorrowDate = new Date(time);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStr = `${tomorrowDate.getDate()}-${tomorrowDate.getMonth() + 1}-${tomorrowDate.getFullYear()}`;
        
        const [resToday, resTomorrow] = await Promise.all([
          fetch(`https://api.aladhan.com/v1/timings/${todayStr}?latitude=${currentLocationData.lat}&longitude=${currentLocationData.lng}&method=${currentLocationData.method}`),
          fetch(`https://api.aladhan.com/v1/timings/${tomorrowStr}?latitude=${currentLocationData.lat}&longitude=${currentLocationData.lng}&method=${currentLocationData.method}`)
        ]);

        const dataToday = await resToday.json();
        const dataTomorrow = await resTomorrow.json();

        if (dataToday.code === 200) setApiTimes(dataToday.data.timings);
        if (dataTomorrow.code === 200) setApiTimesTomorrow(dataTomorrow.data.timings);
      } catch (err) {
        console.error("Failed to fetch Aladhan API", err);
      } finally {
        setIsLoadingTimes(false);
      }
    };
    
    fetchTimes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocationData.id]);

  const handleSaveMuezzin = async () => {
    const selectedMuezzin = MUEZZINS.find((m) => m.id === selectedVoice);
    if (selectedMuezzin && (selectedMuezzin as any).isPremium && profile?.role !== 'vip' && profile?.role !== 'admin') {
      return; // Do nothing if trying to save premium voice while not VIP
    }
    if (user) await updateMuezzin(selectedVoice);
    setIsMuezzinModalOpen(false);
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        let closestLocation = LOCATIONS[0];
        let minDistance = Infinity;

        LOCATIONS.forEach((location) => {
          const distance = Math.sqrt(
            Math.pow(location.lat - latitude, 2) + Math.pow(location.lng - longitude, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestLocation = location;
          }
        });

        setSelectedLocation(closestLocation.id);
      }, (error) => {
        console.error("Error getting location: ", error);
        let message = "تعذر الحصول على الموقع التلقائي.";
        if (error.code === 1) message = "يرجى السماح بالوصول للموقع من إعدادات المتصفح.";
        else if (error.code === 2) message = "الموقع غير متوفر حالياً.";
        else if (error.code === 3) message = "انتهت مهلة الطلب، يرجى المحاولة مرة أخرى.";
        alert(message);
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } else {
      alert("متصفحك لا يدعم تحديد الموقع التلقائي.");
    }
  };

  const handleSaveLocation = async () => {
    if (user) await updateLocation(selectedLocation);
    setIsLocationModalOpen(false);
  };

  const togglePreview = (muezzinId: string, audioUrl?: string) => {
    const muezzin = MUEZZINS.find((m) => m.id === muezzinId);
    if (muezzin && (muezzin as any).isPremium && profile?.role !== 'vip' && profile?.role !== 'admin') {
      return;
    }

    if (playingMuezzinId === muezzinId) {
      soundRef.current?.stop();
      soundRef.current?.unload();
      soundRef.current = null;
      setPlayingMuezzinId(null);
    } else {
      soundRef.current?.stop();
      soundRef.current?.unload();
      
      soundRef.current = new Howl({
        src: [audioUrl || ''],
        html5: true,
        format: ['mp3'],
        onload: () => {
          soundRef.current?.play();
          setPlayingMuezzinId(muezzinId);
        },
        onend: () => setPlayingMuezzinId(null),
        onloaderror: (_id, err) => { console.error("Load error", _id, err); setPlayingMuezzinId(null); },
        onplayerror: (_id, err) => { console.error("Play error", _id, err); setPlayingMuezzinId(null); }
      });
      // Note: We don't setPlayingMuezzinId here yet, we wait for onload.
      // But to give instant feedback, maybe we should indicate loading state?
      // For now, let's just stick to playing on load.
    }
  };

  const { nextPrayer, msLeft, progress, currentTimesArray } = useMemo(() => {
    if (!apiTimes || !apiTimesTomorrow) {
      return { nextPrayer: 'none', msLeft: 0, progress: 0, currentTimesArray: null };
    }

    const parseTime = (timeStr: string, isTomorrow = false) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const d = new Date(time);
      if (isTomorrow) d.setDate(d.getDate() + 1);
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    const prayers = PRAYER_KEYS.map(key => ({
      key,
      date: parseTime(apiTimes[key])
    }));

    const tomorrowPrayers = PRAYER_KEYS.map(key => ({
      key,
      date: parseTime(apiTimesTomorrow[key], true)
    }));

    // Find next prayer today
    let next = prayers.find(p => p.date.getTime() > time.getTime());
    let previous = [...prayers].reverse().find(p => p.date.getTime() <= time.getTime());

    // If no next prayer today, it's Fajr tomorrow
    if (!next) {
      next = tomorrowPrayers[0]; // Fajr tomorrow
    }
    
    // If no previous prayer today, it's Isha yesterday
    if (!previous) {
      const yesterdayIshaTime = new Date(time);
      yesterdayIshaTime.setDate(yesterdayIshaTime.getDate() - 1);
      const [hours, minutes] = apiTimes['Isha'].split(':').map(Number);
      yesterdayIshaTime.setHours(hours, minutes, 0, 0);
      previous = { key: 'Isha', date: yesterdayIshaTime };
    }

    const msLeft = next.date.getTime() - time.getTime();
    const totalDuration = next.date.getTime() - previous.date.getTime();
    const elapsed = time.getTime() - previous.date.getTime();
    const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

    // Convert to a map for easy rendering
    const currentTimesArray = PRAYER_KEYS.map(key => ({
      key,
      timeStr: apiTimes[key],
      date: parseTime(apiTimes[key])
    }));

    return { 
      nextPrayer: next.key, 
      msLeft,
      progress,
      currentTimesArray
    };
  }, [time, apiTimes, apiTimesTomorrow]);

  const formatAMPMStr = (timeStr: string) => {
    if (!timeStr) return '--:--';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="min-h-screen bg-mosque bg-cover relative pt-[100px] px-6">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 pt-10">
        {/* Date and Location */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white"
        >
          <div className="text-lg font-arabic tracking-wide flex items-center justify-center gap-2">
            <button 
              onClick={() => setIsLocationModalOpen(true)} 
              className="flex items-center gap-2 hover:text-brand-gold transition-colors"
            >
              <MapPin size={18} className="text-brand-gold-light" />
              {currentLocationData.name}
            </button>
          </div>
          <p className="text-sm opacity-80 mt-1">
            {time.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Prayer Times Widget */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-12 bg-brand-emerald-light rounded-3xl p-6 text-center shadow-2xl border border-brand-gold/20 relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-gold/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setIsMuezzinModalOpen(true)}
              className="text-white hover:text-brand-gold-light transition-colors"
            >
              <Volume2 size={24} />
            </button>
            <h2 className="text-xl font-bold text-white">{t('nextPrayer')}</h2>
            <button className="text-white hover:text-brand-gold-light transition-colors">
              <Bell size={24} />
            </button>
          </div>

          <p className="text-5xl font-arabic font-bold text-brand-gold mb-2">
            {t(nextPrayer as any)}
          </p>
          <p className="text-4xl font-mono text-white tracking-wider mb-4">
            {formatTimeLeft(msLeft)}
          </p>
          
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              style={{ width: `${progress}%` }}
              className="h-full bg-brand-gold rounded-full"
            />
          </div>
          
          <div className="flex justify-between mt-6 text-sm text-white/80">
            {currentTimesArray ? currentTimesArray.map((prayer) => (
              <div key={prayer.key} className={clsx("flex flex-col items-center", nextPrayer === prayer.key && "font-bold text-brand-gold")}>
                <span className={clsx("text-xs transition-opacity mb-1", nextPrayer === prayer.key ? "opacity-100" : "opacity-70")}>
                  {t(prayer.key as any)}
                </span>
                <span>{formatAMPMStr(prayer.timeStr)}</span>
              </div>
            )) : Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center opacity-50">
                <span className="text-xs mb-1">--</span>
                <span>--:--</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Links Group */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid grid-cols-3 gap-4 px-2 pb-24"
        >
          {[
            { title: t('quran'), to: "/quran", icon: "📖" },
            { title: t('qibla'), to: "/qibla", icon: "🧭" },
            { title: t('adhkar'), to: "/adhkar", icon: "📿" }
          ].map((item, i) => (
            <Link key={i} to={item.to} className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 bg-brand-emerald-light border border-brand-gold/30 rounded-full flex items-center justify-center text-brand-gold shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-2xl">{item.icon}</span>
              </div>
              <span className="text-xs font-bold text-white">{item.title}</span>
            </Link>
          ))}
        </motion.div>
        <AdhkarBanner />
      </div>

      <AnimatePresence>
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLocationModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-brand-emerald-light rounded-3xl p-6 border border-brand-gold/20 shadow-2xl"
            >
              <button 
                onClick={() => setIsLocationModalOpen(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
                title="إغلاق"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-bold text-white font-arabic mb-2 text-center">{t('location')}</h3>
              <p className="text-sm text-slate-400 mb-6 text-center">{t('selectLocation')}</p>
              
              <button
                onClick={handleDetectLocation}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 mb-4 transition-all"
              >
                 <MapPin size={18} />
                 تحديد الموقع تلقائياً
              </button>

              <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2">
                {LOCATIONS.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location.id)}
                    className={clsx(
                      "w-full text-right flex items-center justify-between p-4 rounded-2xl transition-all border",
                      selectedLocation === location.id
                        ? "bg-brand-emerald border-brand-gold text-white"
                        : "bg-brand-emerald/30 border-transparent text-slate-300 hover:bg-brand-emerald/50"
                    )}
                  >
                    <div className="font-bold font-arabic text-lg">{location.name}</div>
                    {selectedLocation === location.id && (
                      <div className="w-6 h-6 rounded-full bg-brand-gold text-brand-dark flex flex-shrink-0 items-center justify-center">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleSaveLocation}
                className="w-full py-4 bg-brand-gold text-brand-dark font-bold rounded-xl shadow-lg hover:shadow-brand-gold/20 active:scale-95 transition-all text-lg font-arabic"
              >
                {t('saveChanges')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMuezzinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMuezzinModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-brand-emerald-light rounded-3xl p-6 border border-brand-gold/20 shadow-2xl"
            >
              <button 
                onClick={() => setIsMuezzinModalOpen(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
                title="إغلاق"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-bold text-white font-arabic mb-2 text-center">{t('azanVoices')}</h3>
              <p className="text-sm text-slate-400 mb-6 text-center">{t('selectVoice')}</p>
              
              <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2">
                {MUEZZINS.map((muezzin) => (
                  <div
                    key={muezzin.id}
                    className={clsx(
                      "w-full text-right flex items-center justify-between p-4 rounded-2xl transition-all border",
                      selectedVoice === muezzin.id
                        ? "bg-brand-emerald border-brand-gold text-white"
                        : "bg-brand-emerald/30 border-transparent text-slate-300 hover:bg-brand-emerald/50"
                    )}
                  >
                    <button 
                      className="flex-grow text-right"
                      onClick={() => setSelectedVoice(muezzin.id)}
                    >
                      <div className="font-bold font-arabic text-lg flex items-center">
                        {muezzin.name}
                        {(muezzin as any).isPremium && <span className="mr-2 text-[10px] bg-brand-gold text-brand-dark px-1.5 py-0.5 rounded-full font-sans font-bold">مميز</span>}
                      </div>
                      <div className="text-xs opacity-70 mt-1">{muezzin.location}</div>
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <button 
                         onClick={() => togglePreview(muezzin.id, muezzin.audioUrl)}
                         className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                      >
                        {playingMuezzinId === muezzin.id ? <Pause size={18} /> : <Play size={18} />}
                      </button>

                      {selectedVoice === muezzin.id && (
                        <div className="w-6 h-6 rounded-full bg-brand-gold text-brand-dark flex flex-shrink-0 items-center justify-center">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleSaveMuezzin}
                className="w-full py-4 bg-brand-gold text-brand-dark font-bold rounded-xl shadow-lg hover:shadow-brand-gold/20 active:scale-95 transition-all text-lg font-arabic"
              >
                {t('saveChanges')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
