import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Sparkles, Plus, Quote, Hash } from 'lucide-react';
import clsx from 'clsx';

const categories = [
  { id: 'morning', label: 'أذكار الصباح', icon: Sun },
  { id: 'evening', label: 'أذكار المساء', icon: Moon },
  { id: 'sleep', label: 'أذكار النوم', icon: Sparkles },
  { id: 'tasbeeh', label: 'المسبحة', icon: Hash }
];

const mockAdhkar = [
  { id: 1, text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', count: 100 },
  { id: 2, text: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', count: 100 },
  { id: 3, text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ', count: 10 }
];

const TASBEEH_ITEMS = [
  { id: 'subhanallah', text: 'سُبْحَانَ اللَّهِ', goal: 100 },
  { id: 'alhamdulillah', text: 'الْحَمْدُ لِلَّهِ', goal: 100 },
  { id: 'allahuakbar', text: 'اللَّهُ أَكْبَرُ', goal: 100 },
  { id: 'la_ilaha_illallah', text: 'لَا إِلَهَ إِلَّا اللَّهُ', goal: 100 },
  { id: 'astaghfirullah', text: 'أَسْتَغْفِرُ اللَّهَ', goal: 100 }
];

type TasbeehCount = { daily: number; total: number };

export default function AdhkarPage() {
  const [activeTab, setActiveTab] = useState('morning');
  const [counters, setCounters] = useState<Record<number, number>>({});
  
  const [tasbeehData, setTasbeehData] = useState<Record<string, TasbeehCount>>(() => {
    try {
      const saved = localStorage.getItem('tasbeeh_data_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = new Date().toLocaleDateString('en-US');
        if (parsed.date !== today) {
          // Reset daily counts but keep totals
          const resetCounts: Record<string, TasbeehCount> = {};
          Object.keys(parsed.counts).forEach(key => {
            resetCounts[key] = { daily: 0, total: parsed.counts[key].total || 0 };
          });
          return resetCounts;
        }
        return parsed.counts;
      }
    } catch (e) {
      console.error("Failed to parse tasbeeh data", e);
    }
    
    // Default
    const defaultData: Record<string, TasbeehCount> = {};
    TASBEEH_ITEMS.forEach(t => { defaultData[t.id] = { daily: 0, total: 0 }; });
    return defaultData;
  });

  const handleCount = (id: number, max: number) => {
    setCounters(prev => {
      const current = prev[id] || 0;
      if (current < max) return { ...prev, [id]: current + 1 };
      return prev;
    });
  };

  const handleReset = (id: number) => {
    setCounters(prev => ({ ...prev, [id]: 0 }));
  };

  const handleTasbeehCount = (id: string) => {
    setTasbeehData(prev => {
      const current = prev[id] || { daily: 0, total: 0 };
      const nextCounts = {
        ...prev,
        [id]: { daily: current.daily + 1, total: current.total + 1 }
      };
      
      localStorage.setItem('tasbeeh_data_v1', JSON.stringify({
        date: new Date().toLocaleDateString('en-US'),
        counts: nextCounts
      }));
      
      return nextCounts;
    });
  };

  return (
    <div className="p-6 pt-[100px] pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-arabic font-bold text-white mb-2">حصن المسلم</h1>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={clsx(
              "flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all font-medium text-sm border",
              activeTab === cat.id 
                ? "bg-brand-emerald-light border-brand-gold text-brand-gold shadow-md shadow-brand-gold/10" 
                : "bg-brand-emerald border-brand-gold/20 text-slate-400 hover:text-slate-200"
            )}
          >
            <cat.icon size={16} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {activeTab === 'tasbeeh' ? (
            TASBEEH_ITEMS.map((tasbeeh, idx) => {
              const currentData = tasbeehData[tasbeeh.id] || { daily: 0, total: 0 };
              
              return (
                <motion.div
                  key={tasbeeh.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-brand-emerald-light rounded-3xl p-6 border border-brand-gold/20 transition-all relative overflow-hidden shadow-sm"
                >
                  <p className="font-arabic text-3xl leading-relaxed text-center mb-6 pt-2 text-white">
                    {tasbeeh.text}
                  </p>

                  <div className="w-full bg-brand-emerald h-2 rounded-full overflow-hidden mb-6 border border-brand-gold/10">
                    <motion.div 
                      className="h-full bg-brand-gold transition-all duration-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((currentData.daily / (tasbeeh.goal || 100)) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-500 mb-1">المجموع الكلي</span>
                      <span className="text-xl font-bold text-slate-300 font-mono">{currentData.total}</span>
                    </div>

                    <button
                      onClick={() => handleTasbeehCount(tasbeeh.id)}
                      className="w-20 h-20 rounded-full flex gap-1 flex-col items-center justify-center transition-all transform active:scale-95 shadow-lg border-2 border-brand-gold/30 bg-brand-emerald text-brand-gold hover:bg-brand-emerald/80"
                    >
                       <motion.span
                        key={currentData.daily}
                        initial={{ scale: 1.2, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-3xl font-bold font-mono"
                       >
                         {currentData.daily}
                       </motion.span>
                    </button>

                    <div className="flex flex-col items-center opacity-70">
                      <span className="text-xs text-slate-500">الهدف</span>
                      <span className="text-xl font-bold text-slate-300 font-mono">{tasbeeh.goal || 100}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })
          ) : (
            mockAdhkar.map((zhikr, idx) => {
              const currentCount = counters[zhikr.id] || 0;
              const progress = (currentCount / zhikr.count) * 100;
              const isCompleted = currentCount >= zhikr.count;

              return (
                <motion.div
                  key={zhikr.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className={clsx(
                    "bg-brand-emerald-light rounded-3xl p-6 border transition-all relative overflow-hidden shadow-sm",
                    isCompleted ? "border-brand-gold shadow-brand-gold/10" : "border-brand-gold/20"
                  )}
                >
                  {/* Progress bg */}
                  <div className="w-full bg-brand-emerald h-2 rounded-full overflow-hidden mb-6 border border-brand-gold/10">
                    <motion.div 
                      className="h-full bg-brand-gold transition-all duration-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="font-arabic text-2xl leading-relaxed text-center mb-6 pt-2 text-white">
                    {zhikr.text}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <button 
                      onClick={() => handleReset(zhikr.id)}
                      className="text-xs text-slate-500 hover:text-slate-300 underline"
                    >
                      إعادة
                    </button>

                    <button
                      onClick={() => handleCount(zhikr.id, zhikr.count)}
                      disabled={isCompleted}
                      className={clsx(
                        "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all transform active:scale-95 shadow-lg border border-brand-gold/30",
                        isCompleted 
                          ? "bg-brand-gold text-brand-dark" 
                          : "bg-brand-emerald text-brand-gold hover:bg-brand-emerald/80"
                      )}
                    >
                      {isCompleted ? <Sparkles size={24} /> : currentCount}
                    </button>

                    <div className="text-sm font-medium text-slate-500">
                      من <span className="text-slate-200">{zhikr.count}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
