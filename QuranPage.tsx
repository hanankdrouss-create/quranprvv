import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, PlayCircle, Download, BookOpen, Lock, X, ChevronDown, ChevronUp, Loader2, PauseCircle, Music, SkipBack } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import surahsData from '../data/surahs.json';

const surahs = surahsData;

const QARIS = [
  { id: 'afs', name: 'مشاري العفاسي', server: 'https://server8.mp3quran.net/afs' },
  { id: 'basit', name: 'عبد الباسط عبد الصمد', server: 'https://server7.mp3quran.net/basit' },
  { id: 's_gmd', name: 'سعد الغامدي', server: 'https://server7.mp3quran.net/s_gmd' },
  { id: 'maher', name: 'ماهر المعيقلي', server: 'https://server12.mp3quran.net/maher' },
  { id: 'yasser', name: 'ياسر الدوسري', server: 'https://server11.mp3quran.net/yasser' }
];

export default function QuranPage() {
  const { profile, updateProgress } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<{ id: number, name: string } | null>(null);
  const [expandedTafsir, setExpandedTafsir] = useState<number | null>(null);
  
  const [surahContent, setSurahContent] = useState<{numberInSurah: number, text: string, tafsir: string, translation: string}[] | null>(null);
  const [loadingSurah, setLoadingSurah] = useState(false);

  const [selectedQari, setSelectedQari] = useState(QARIS[0].id);
  const [playingSurah, setPlayingSurah] = useState<{id: number, qari: string} | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expandedTranslation, setExpandedTranslation] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  const isVip = profile?.role === 'vip' || profile?.role === 'admin';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setPlayingSurah(null); setCurrentTime(0); };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const getAudioUrl = (surahId: number, qariId: string) => {
    const qari = QARIS.find(q => q.id === qariId);
    const paddedId = String(surahId).padStart(3, '0');
    return `${qari?.server}/${paddedId}.mp3`;
  };

  const handleDownload = (surahId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVip) {
      setDownloading(surahId);
      const url = getAudioUrl(surahId, selectedQari);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = `surah-${surahId}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => setDownloading(null), 500);
    }
  };

  const handlePlay = (surahId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (playingSurah?.id === surahId && playingSurah?.qari === selectedQari) {
       if (isPlaying) {
         audioRef.current?.pause();
       } else {
         audioRef.current?.play();
       }
    } else {
       setPlayingSurah({ id: surahId, qari: selectedQari });
       if (audioRef.current) {
          audioRef.current.src = getAudioUrl(surahId, selectedQari);
          audioRef.current.play().catch(console.error);
       }
    }
  };

  const handleSelectSurah = async (surah: { id: number, name: string }) => {
    setSelectedSurah(surah);
    setExpandedTafsir(null);
    setSurahContent(null);
    setLoadingSurah(true);
    
    if (profile) {
      updateProgress({ lastReadSurah: surah.id, lastReadAyah: 1, lastReadPage: 1 }).catch(console.error);
    }
    
    try {
      const [textRes, tafsirRes, translationRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surah.id}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/surah/${surah.id}/ar.muyassar`),
        fetch(`https://api.alquran.cloud/v1/surah/${surah.id}/en.asad`)
      ]);
      const textData = await textRes.json();
      const tafsirData = await tafsirRes.json();
      const translationData = await translationRes.json();
      
      if (textData.code === 200 && tafsirData.code === 200 && translationData.code === 200) {
        const aggregated = textData.data.ayahs.map((ayah: any, index: number) => ({
           numberInSurah: ayah.numberInSurah,
           text: ayah.text,
           tafsir: tafsirData.data.ayahs[index].text,
           translation: translationData.data.ayahs[index].text
        }));
        setSurahContent(aggregated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSurah(false);
    }
  };

  const toggleTafsir = (verseNumber: number) => {
    if (expandedTafsir === verseNumber) {
      setExpandedTafsir(null);
    } else {
      setExpandedTafsir(verseNumber);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (selectedSurah) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="p-6 pt-[100px] pb-32 min-h-screen relative max-w-3xl mx-auto"
      >
        <div className="sticky top-[80px] z-10 bg-brand-dark/95 backdrop-blur-md pb-4 mb-8 border-b border-white/5 flex items-center justify-between">
          <button 
            onClick={() => { setSelectedSurah(null); setExpandedTafsir(null); }}
            className="w-10 h-10 flex items-center justify-center bg-brand-emerald-light rounded-full text-slate-400 hover:text-white hover:bg-brand-emerald transition-all"
          >
            <X size={20} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-arabic font-bold text-brand-gold">{selectedSurah.name}</h1>
            <span className="text-xs text-slate-400 font-arabic mt-1">
              {surahs.find(s => s.id === selectedSurah.id)?.type} • {surahs.find(s => s.id === selectedSurah.id)?.verses} آية
            </span>
          </div>
          <button 
            onClick={() => handlePlay(selectedSurah.id)}
            className="w-10 h-10 flex items-center justify-center bg-brand-gold/10 rounded-full text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-all"
          >
            {playingSurah?.id === selectedSurah.id && isPlaying ? <PauseCircle size={22} /> : <PlayCircle size={22} />}
          </button>
        </div>

        <div className="scroll-smooth">
          {loadingSurah ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 size={48} className="text-brand-gold/50 animate-spin mb-4" />
              <p className="text-xl text-slate-300 font-arabic mb-2">جاري تحميل السورة...</p>
            </div>
          ) : surahContent ? (
            <div className="space-y-6">
              {surahContent.map((verse) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  key={verse.numberInSurah} 
                  className={clsx(
                    "bg-brand-emerald-light/40 border border-brand-gold/5 rounded-2xl p-6 shadow-sm relative overflow-hidden backdrop-blur-sm transition-all hover:bg-brand-emerald-light/60 hover:border-brand-gold/20 cursor-pointer",
                    expandedTranslation === verse.numberInSurah && "border-brand-gold/30"
                  )}
                  onClick={() => setExpandedTranslation(expandedTranslation === verse.numberInSurah ? null : verse.numberInSurah)}
                >
                  <div className="flex justify-between items-start gap-4 flex-row-reverse mb-6">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border border-brand-gold/50 text-brand-gold font-bold bg-brand-dark/40 text-sm shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                      {verse.numberInSurah}
                    </div>
                    <div className="flex-grow text-right">
                       <p className="font-arabic text-3xl leading-[2.2] px-2 text-white/90">
                         {verse.text}
                       </p>
                       <AnimatePresence>
                         {expandedTranslation === verse.numberInSurah && (
                           <motion.p 
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 1, height: 'auto' }}
                             exit={{ opacity: 0, height: 0 }}
                             className="mt-4 text-brand-gold/90 font-mono text-sm leading-relaxed border-t border-brand-gold/10 pt-4 px-2"
                           >
                             {verse.translation}
                           </motion.p>
                         )}
                       </AnimatePresence>
                     </div>
                   </div>

                  <div className="mt-4 border-t border-white/5 pt-4 flex gap-2">
                    {isVip ? (
                      <div className="w-full">
                        <button 
                          onClick={() => toggleTafsir(verse.numberInSurah)}
                          className="flex items-center justify-between w-full text-sm font-bold text-brand-gold hover:text-brand-gold/80 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen size={16} /> التفسير الميسر
                          </span>
                          {expandedTafsir === verse.numberInSurah ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <AnimatePresence>
                          {expandedTafsir === verse.numberInSurah && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="mt-4 text-brand-gold/90 font-arabic text-lg leading-relaxed border-t border-brand-gold/10 pt-4 px-2 text-right">
                                {verse.tafsir}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-between opacity-60">
                        <span className="flex items-center gap-2 text-sm text-slate-400 font-arabic">
                          <Lock size={16} /> التفسير الحصري لـ VIP
                        </span>
                        <Link to="/vip" className="text-xs font-bold text-brand-gold border border-brand-gold/50 px-3 py-1 rounded-full hover:bg-brand-gold hover:text-brand-dark transition-colors">
                          ترقية
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-brand-emerald-light/20 rounded-3xl border border-white/5"
            >
              <BookOpen size={48} className="text-brand-gold/20 mb-4" />
              <p className="text-xl text-slate-300 font-arabic mb-2">تعذر تحميل السورة</p>
              <button onClick={() => handleSelectSurah(selectedSurah)} className="text-brand-gold mt-4 hover:underline text-sm">حاول مرة أخرى</button>
            </motion.div>
          )}
        </div>
        
        {/* Floating audio player if playing while reading */}
        <AnimatePresence>
          {playingSurah && (
            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-[80px] left-4 right-4 bg-brand-emerald/95 backdrop-blur-xl border border-brand-gold/20 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 z-50 max-w-2xl mx-auto"
            >
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-brand-dark rounded-full flex items-center justify-center relative overflow-hidden border border-brand-gold/10">
                     {isPlaying ? (
                       <div className="flex gap-[3px] items-end h-4">
                          <motion.div animate={{ height: ['20%', '80%', '40%'] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-[3px] bg-brand-gold rounded-full" />
                          <motion.div animate={{ height: ['50%', '100%', '30%'] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} className="w-[3px] bg-brand-gold rounded-full" />
                          <motion.div animate={{ height: ['30%', '90%', '50%'] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-[3px] bg-brand-gold rounded-full" />
                          <motion.div animate={{ height: ['60%', '40%', '80%'] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.15 }} className="w-[3px] bg-brand-gold rounded-full" />
                       </div>
                     ) : (
                       <Music size={16} className="text-brand-gold/50" />
                     )}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-white font-bold font-arabic text-sm">{surahs.find(s => s.id === playingSurah.id)?.name}</span>
                      <span className="text-brand-gold/70 text-xs font-arabic">{QARIS.find(q => q.id === playingSurah.qari)?.name}</span>
                   </div>
                 </div>
                 <div className="flex flex-row-reverse items-center gap-3">
                   <motion.button 
                      onClick={() => handlePlay(playingSurah.id)}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 flex items-center justify-center bg-brand-gold rounded-full text-brand-dark hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                    >
                      {isPlaying ? <PauseCircle size={24} className="fill-brand-dark" /> : <PlayCircle size={24} className="fill-brand-dark" />}
                    </motion.button>
                   <motion.button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0;
                        }
                      }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-slate-300 hover:text-brand-gold hover:bg-white/10 transition-all"
                      title="إعادة السورة من البداية"
                    >
                      <SkipBack size={20} />
                   </motion.button>
                 </div>
               </div>
               <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400 font-mono w-10 text-right">{formatTime(currentTime)}</span>
                  <input 
                    type="range" 
                    min="0" 
                    max={duration || 100} 
                    value={currentTime} 
                    onChange={(e) => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = Number(e.target.value);
                        setCurrentTime(Number(e.target.value));
                      }
                    }}
                    className="flex-grow h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                  />
                  <span className="text-xs text-slate-400 font-mono w-10">{formatTime(duration)}</span>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <div className="p-6 pt-[100px] pb-32">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-arabic font-bold text-white mb-2">القرآن الكريم</h1>
        <p className="text-brand-gold/80 text-sm font-arabic">استمع واقرأ بصوت قارئك المفضل</p>
      </motion.div>

      <div className="relative mb-6 shadow-sm">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-brand-gold/50" />
        </div>
        <input
          type="text"
          className="block w-full pl-3 pr-10 py-3.5 border border-brand-gold/10 rounded-2xl leading-5 bg-brand-emerald-light/50 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-gold/50 focus:border-brand-gold/50 focus:bg-brand-emerald-light transition-all text-white font-arabic"
          placeholder="ابحث عن سورة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
        <div className="flex gap-2 min-w-max">
          {QARIS.map(qari => (
            <button
              key={qari.id}
              onClick={() => setSelectedQari(qari.id)}
              className={clsx(
                "px-5 py-2.5 rounded-full text-sm font-arabic transition-all border shadow-sm",
                selectedQari === qari.id 
                  ? "bg-brand-gold text-brand-dark font-bold border-brand-gold shadow-[0_0_10px_rgba(234,179,8,0.2)]" 
                  : "bg-brand-emerald-light/40 text-slate-300 border-white/5 hover:border-brand-gold/30 hover:bg-brand-emerald-light"
              )}
            >
              {qari.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {surahs.filter(s => s.name.includes(searchTerm)).map((surah, index) => {
          const isThisPlaying = playingSurah?.id === surah.id && playingSurah?.qari === selectedQari;
          return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.02, 0.4) }}
            key={surah.id} 
            onClick={() => handleSelectSurah(surah)}
            className={clsx(
              "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
              isThisPlaying 
                ? "bg-brand-gold/5 border-brand-gold/30 shadow-[0_4px_20px_rgba(234,179,8,0.05)]" 
                : "bg-brand-emerald-light/40 border-white/5 shadow-sm hover:border-brand-gold/20 hover:bg-brand-emerald-light/60"
            )}
          >
            {isThisPlaying && (
              <motion.div 
                layoutId="activeSurahBg"
                className="absolute inset-0 bg-gradient-to-r from-brand-gold/0 via-brand-gold/5 to-brand-gold/0" 
              />
            )}
            <div className="flex items-center gap-4 relative z-10 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-brand-dark/50 flex items-center justify-center relative overflow-hidden border border-brand-gold/10">
                <span className={clsx("font-bold text-lg relative z-10", isThisPlaying ? "text-brand-gold" : "text-white")}>{surah.id}</span>
              </div>
              <div className="flex flex-col items-start">
                <h2 className={clsx("font-arabic font-bold text-xl", isThisPlaying ? "text-brand-gold" : "text-white")}>{surah.name}</h2>
                <p className="text-xs text-slate-400 mt-1 font-arabic">{surah.type} • {surah.verses} آية</p>
              </div>
            </div>
            <div className="flex items-center gap-3 relative z-10" onClick={(e) => e.stopPropagation()}>
              {isVip ? (
                <button 
                  onClick={(e) => handleDownload(surah.id, e)}
                  disabled={downloading === surah.id}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-brand-gold hover:bg-brand-gold/10 transition-all disabled:opacity-50"
                  title="تحميل"
                >
                  {downloading === surah.id ? <Loader2 size={18} className="animate-spin text-brand-gold" /> : <Download size={18} />}
                </button>
              ) : (
                <Link to="/home/vip" className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:text-brand-gold hover:bg-white/5 transition-all" title="التحميل للمشتركين فقط" onClick={(e) => e.stopPropagation()}>
                  <Lock size={16} />
                </Link>
              )}
              <button 
                onClick={(e) => handlePlay(surah.id, e)}
                className={clsx(
                  "w-12 h-12 flex items-center justify-center rounded-full transition-all",
                  isThisPlaying 
                    ? "bg-brand-gold text-brand-dark shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:scale-105" 
                    : "bg-brand-emerald border border-white/5 text-slate-300 hover:text-brand-gold hover:border-brand-gold/30 hover:scale-105"
                )}
              >
                {isThisPlaying && isPlaying ? <PauseCircle size={24} className="fill-current" /> : <PlayCircle size={24} className={isThisPlaying ? "fill-current" : ""} />}
              </button>
            </div>
          </motion.div>
          );
        })}
      </div>
      <audio 
        ref={audioRef} 
        onError={() => {
          alert('تعذر تشغيل هذا المقطع حالياً');
          setPlayingSurah(null);
          setIsPlaying(false);
        }}
        className="hidden"
      />

      {/* Floating audio player if playing from list (so it stays visible everywhere) */}
      <AnimatePresence>
        {playingSurah && !selectedSurah && (
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-[80px] left-4 right-4 bg-brand-emerald/95 backdrop-blur-xl border border-brand-gold/20 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 z-50 max-w-md mx-auto"
          >
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-brand-dark/50 rounded-full flex items-center justify-center relative overflow-hidden border border-brand-gold/10">
                   {isPlaying ? (
                     <div className="flex gap-[3px] items-end h-[14px]">
                        <motion.div animate={{ height: ['20%', '100%', '40%'] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-[2px] bg-brand-gold rounded-full" />
                        <motion.div animate={{ height: ['60%', '20%', '80%'] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} className="w-[2px] bg-brand-gold rounded-full" />
                        <motion.div animate={{ height: ['40%', '90%', '30%'] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-[2px] bg-brand-gold rounded-full" />
                     </div>
                   ) : (
                     <Music size={16} className="text-brand-gold/50" />
                   )}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-white font-bold font-arabic text-sm">{surahs.find(s => s.id === playingSurah.id)?.name}</span>
                    <span className="text-brand-gold/70 text-xs font-arabic">{QARIS.find(q => q.id === playingSurah.qari)?.name}</span>
                 </div>
               </div>
               <div className="flex flex-row-reverse items-center gap-2">
                 <motion.button 
                    onClick={(e) => handlePlay(playingSurah.id, e)}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 flex items-center justify-center bg-brand-gold rounded-full text-brand-dark hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                  >
                    {isPlaying ? <PauseCircle size={22} className="fill-brand-dark" /> : <PlayCircle size={22} className="fill-brand-dark" />}
                  </motion.button>
                 <motion.button
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                      }
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-full text-slate-300 hover:text-brand-gold hover:bg-white/10 transition-all"
                    title="إعادة السورة من البداية"
                  >
                    <SkipBack size={18} />
                 </motion.button>
               </div>
             </div>
             <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-slate-400 font-mono w-8 text-right">{formatTime(currentTime)}</span>
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 100} 
                  value={currentTime} 
                  onChange={(e) => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = Number(e.target.value);
                      setCurrentTime(Number(e.target.value));
                    }
                  }}
                  className="flex-grow h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                />
                <span className="text-[10px] text-slate-400 font-mono w-8">{formatTime(duration)}</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

