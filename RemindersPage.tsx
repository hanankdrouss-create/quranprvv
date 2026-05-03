import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Plus, X, Trash2, Clock, CalendarDays, Music } from 'lucide-react';
import clsx from 'clsx';

interface Reminder {
  id: string;
  title: string;
  time: string;
  days: number[];
  isActive: boolean;
  sound?: string;
}

const SOUNDS = [
  { id: 'default', label: 'التنبيه الافتراضي' },
  { id: 'adhan_short', label: 'أذان قصير' },
  { id: 'birds', label: 'صوت عصافير' },
  { id: 'chime', label: 'جرس هادئ' },
];

const WEEKDAYS = [
  { id: 0, label: 'الأحد' },
  { id: 1, label: 'الإثنين' },
  { id: 2, label: 'الثلاثاء' },
  { id: 3, label: 'الأربعاء' },
  { id: 4, label: 'الخميس' },
  { id: 5, label: 'الجمعة' },
  { id: 6, label: 'السبت' },
];

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newDays, setNewDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [newSound, setNewSound] = useState('default');
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, `users/${user.uid}/reminders`),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsed = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Reminder));
      setReminders(parsed);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/reminders`));

    return () => unsubscribe();
  }, [user]);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim() || newDays.length === 0) return;

    try {
      await addDoc(collection(db, `users/${user.uid}/reminders`), {
        title: newTitle.trim(),
        time: newTime,
        days: newDays,
        sound: newSound,
        isActive: true,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewTime('08:00');
      setNewDays([0, 1, 2, 3, 4, 5, 6]);
      setNewSound('default');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/reminders`);
    }
  };

  const toggleDay = (dayId: number) => {
    setNewDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const handleEditReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingReminder) return;

    try {
      await updateDoc(doc(db, `users/${user.uid}/reminders/${editingReminder.id}`), {
        title: editingReminder.title,
        time: editingReminder.time,
        days: editingReminder.days,
        sound: editingReminder.sound,
        updatedAt: serverTimestamp()
      });
      setIsEditModalOpen(false);
      setEditingReminder(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/reminders/${editingReminder.id}`);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/reminders/${id}`), {
        isActive: !currentStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/reminders/${id}`);
    }
  };

  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);

  const performDelete = async () => {
    if (!user || !reminderToDelete) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/reminders/${reminderToDelete}`));
      setReminderToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/reminders/${reminderToDelete}`);
      setReminderToDelete(null);
    }
  };

  const deleteReminder = async (id: string) => {
    setReminderToDelete(id);
  };

  if (!user) {
    return (
      <div className="p-6 pt-[100px] pb-24 min-h-screen flex flex-col items-center justify-center text-center">
        <Bell size={64} className="text-brand-gold/20 mb-6" />
        <p className="text-xl text-slate-300 font-arabic mb-2">سجل دخولك لإضافة تذكيرات خاصة بك</p>
        <p className="text-slate-500 text-sm">التذكيرات ستظل متزامنة في كل أجهزتك</p>
      </div>
    );
  }

  return (
    <div className="p-6 pt-[100px] pb-24 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-gold text-brand-dark px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-gold/20 hover:scale-105 transition-transform flex items-center gap-2"
        >
          <Plus size={18} />
          <span>تذكير جديد</span>
        </button>
        <h1 className="text-3xl font-arabic font-bold text-white uppercase tracking-wider">المهام والجداول</h1>
      </div>

      <div className="space-y-4">
        {reminders.length === 0 ? (
           <div className="text-center py-10 opacity-70">
             <Bell size={48} className="mx-auto text-brand-gold/30 mb-4" />
             <p className="font-arabic text-lg text-slate-300">لم تقم بإضافة أي تذكيرات بعد</p>
           </div>
        ) : (
          <AnimatePresence>
            {reminders.map((reminder) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={clsx(
                  "p-5 rounded-2xl border transition-all",
                  reminder.isActive 
                     ? "bg-brand-emerald-light border-brand-gold/30 relative overflow-hidden" 
                     : "bg-brand-dark border-white/5 opacity-60"
                )}
              >
                {reminder.isActive && (
                   <div className="absolute top-0 right-0 w-2 h-full bg-brand-gold" />
                )}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => deleteReminder(reminder.id)}
                      className="text-red-400/70 hover:text-red-400 transition-colors p-1 bg-red-400/10 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingReminder(reminder);
                        setIsEditModalOpen(true);
                      }}
                      className="text-brand-gold/70 hover:text-brand-gold transition-colors p-1 bg-brand-gold/10 rounded-lg"
                    >
                      <Clock size={16} /> 
                    </button>
                    {/* Toggle Switch */}
                    <button
                       onClick={() => toggleActive(reminder.id, reminder.isActive)}
                       className={clsx(
                         "w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors border",
                         reminder.isActive ? "bg-brand-gold border-brand-gold justify-end" : "bg-slate-700 border-slate-600 justify-start"
                       )}
                    >
                      <motion.div layout className="w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold font-arabic text-white text-right">{reminder.title}</h3>
                </div>

                <div className="flex items-center justify-end gap-4 text-sm text-slate-400 mt-4 border-t border-white/10 pt-3">
                   <div className="flex items-center gap-1">
                     <span className="font-mono">{reminder.time}</span>
                     <Clock size={14} className="text-brand-gold" />
                   </div>
                   <div className="flex items-center gap-2 flex-wrap justify-end">
                      {reminder.days.length === 7 ? (
                        <span className="text-xs px-2 py-1 bg-brand-emerald rounded-md">يومياً</span>
                      ) : reminder.days.map(d => (
                         <span key={d} className="text-xs px-2 py-1 bg-brand-dark rounded-md">
                           {WEEKDAYS.find(w => w.id === d)?.label.replace('ال', '')}
                         </span>
                      ))}
                      <CalendarDays size={14} className="text-brand-gold ml-1" />
                   </div>
                   {reminder.sound && reminder.sound !== 'default' && (
                     <div className="flex items-center gap-1 text-xs text-brand-gold bg-brand-gold/10 px-2 py-1 rounded-md">
                       <span>{SOUNDS.find(s => s.id === reminder.sound)?.label || 'تنبيه'}</span>
                       <Music size={12} />
                     </div>
                   )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {reminderToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReminderToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-brand-emerald-light rounded-3xl p-6 border border-brand-gold/20 shadow-2xl text-center"
            >
              <h3 className="text-xl font-bold font-arabic text-white mb-4">تأكيد الحذف</h3>
              <p className="text-slate-300 mb-6 font-arabic">هل أنت متأكد من رغبتك في حذف هذا التذكير؟ لا يمكن التراجع عن هذا الإجراء.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setReminderToDelete(null)}
                  className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold font-arabic hover:bg-slate-600 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={performDelete}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold font-arabic hover:bg-red-600 transition-colors"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && editingReminder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-brand-emerald-light rounded-3xl p-6 border border-brand-gold/20 shadow-2xl"
            >
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-bold font-arabic text-white mb-6 text-center">تعديل التذكير</h3>
              
              <form onSubmit={handleEditReminder} className="space-y-4">
                <div className="text-right">
                  <label className="block text-sm text-brand-gold mb-1 font-arabic" dir="rtl">عنوان التذكير</label>
                  <input
                    type="text"
                    value={editingReminder.title}
                    onChange={(e) => setEditingReminder({...editingReminder, title: e.target.value})}
                    placeholder="مثال: ورد التلاوة اليومي"
                    className="w-full bg-brand-dark/50 border border-brand-gold/30 rounded-xl px-4 py-3 text-right text-white focus:outline-none focus:border-brand-gold"
                    required
                    dir="rtl"
                  />
                </div>

                <div className="text-right">
                  <label className="block text-sm text-brand-gold mb-1 font-arabic" dir="rtl">الوقت</label>
                  <input
                    type="time"
                    value={editingReminder.time}
                    onChange={(e) => setEditingReminder({...editingReminder, time: e.target.value})}
                    className="w-full bg-brand-dark/50 border border-brand-gold/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                <div className="text-right pt-2">
                  <label className="block text-sm text-brand-gold mb-2 font-arabic" dir="rtl">الأيام</label>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {WEEKDAYS.map(day => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => setEditingReminder({...editingReminder, days: editingReminder.days.includes(day.id) ? editingReminder.days.filter(d => d !== day.id) : [...editingReminder.days, day.id].sort()})}
                        className={clsx(
                          "w-10 h-10 rounded-lg text-xs font-bold transition-colors",
                          editingReminder.days.includes(day.id)
                            ? "bg-brand-gold text-brand-dark"
                            : "bg-brand-dark border border-white/10 text-slate-400"
                        )}
                      >
                        {day.label.replace('ال', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-right pt-2">
                  <label className="block text-sm text-brand-gold mb-2 font-arabic" dir="rtl">صوت التنبيه</label>
                  <select
                    value={editingReminder.sound || 'default'}
                    onChange={(e) => setEditingReminder({...editingReminder, sound: e.target.value})}
                    className="w-full bg-brand-dark/50 border border-brand-gold/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-gold appearance-none"
                    dir="rtl"
                  >
                    {SOUNDS.map(sound => (
                      <option key={sound.id} value={sound.id} className="bg-brand-dark text-white text-right">
                        {sound.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 mt-6 bg-brand-gold text-brand-dark font-bold font-arabic rounded-xl shadow-lg hover:shadow-brand-gold/20 active:scale-95 transition-all text-lg"
                >
                  حفظ التعديلات
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-brand-emerald-light rounded-3xl p-6 border border-brand-gold/20 shadow-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-bold font-arabic text-white mb-6 text-center">إضافة تذكير جديد</h3>
              
              <form onSubmit={handleAddReminder} className="space-y-4">
                <div className="text-right">
                  <label className="block text-sm text-brand-gold mb-1 font-arabic" dir="rtl">عنوان التذكير</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: ورد التلاوة اليومي"
                    className="w-full bg-brand-dark/50 border border-brand-gold/30 rounded-xl px-4 py-3 text-right text-white focus:outline-none focus:border-brand-gold"
                    required
                    dir="rtl"
                  />
                </div>

                <div className="text-right">
                  <label className="block text-sm text-brand-gold mb-1 font-arabic" dir="rtl">الوقت</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-brand-dark/50 border border-brand-gold/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                <div className="text-right pt-2">
                  <label className="block text-sm text-brand-gold mb-2 font-arabic" dir="rtl">الأيام</label>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {WEEKDAYS.map(day => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={clsx(
                          "w-10 h-10 rounded-lg text-xs font-bold transition-colors",
                          newDays.includes(day.id)
                            ? "bg-brand-gold text-brand-dark"
                            : "bg-brand-dark border border-white/10 text-slate-400"
                        )}
                      >
                        {day.label.replace('ال', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-right pt-2">
                  <label className="block text-sm text-brand-gold mb-2 font-arabic" dir="rtl">صوت التنبيه</label>
                  <select
                    value={newSound}
                    onChange={(e) => setNewSound(e.target.value)}
                    className="w-full bg-brand-dark/50 border border-brand-gold/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-gold appearance-none"
                    dir="rtl"
                  >
                    {SOUNDS.map(sound => (
                      <option key={sound.id} value={sound.id} className="bg-brand-dark text-white text-right">
                        {sound.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!newTitle.trim() || newDays.length === 0}
                  className="w-full py-4 mt-6 bg-brand-gold text-brand-dark font-bold font-arabic rounded-xl shadow-lg hover:shadow-brand-gold/20 active:scale-95 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  حفظ التذكير
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
