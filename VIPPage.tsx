import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Star, ShieldCheck, CheckCircle2, UserX } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import clsx from 'clsx';

export default function VIPPage() {
  const { user, profile } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      const fetchUsers = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'users'));
          const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUsersList(usersData);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'users');
        }
      };
      fetchUsers();
    }
  }, [profile]);

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isBanned: !currentStatus, updatedAt: serverTimestamp() });
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !currentStatus } : u));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const setRole = async (userId: string, role: string) => {
     try {
      await updateDoc(doc(db, 'users', userId), { role, updatedAt: serverTimestamp() });
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  if (!user) {
    return (
      <div className="p-6 pt-[100px] pb-24 text-center mt-20">
        <Crown className="w-16 h-16 text-brand-gold mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">مميزات العضوية المميزة</h2>
        <p className="text-gray-500 mb-6">قم بتسجيل الدخول لاكتشاف المزايا</p>
      </div>
    );
  }

  const isVIP = profile?.role === 'vip' || profile?.role === 'admin';

  return (
    <div className="p-6 pt-[100px] pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center mt-4">
        <div className="inline-flex items-center justify-center p-4 bg-brand-gold/10 rounded-full mb-4">
          <Crown className="w-12 h-12 text-brand-gold" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-gold to-brand-gold-light bg-clip-text text-transparent mb-2">النادي الماسي</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">التجربة الإسلامية المتكاملة</p>
      </motion.div>

      {!isVIP ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-brand-emerald-light to-[#154628] p-6 rounded-3xl border border-brand-gold/30 shadow-[0_0_40px_rgba(245,158,11,0.1)] mb-8"
        >
          <ul className="space-y-4 mb-8">
            {['تفسير الجلالين المفصل', 'تحميل القرآن بجودة عالية جداً', 'إزالة الإعلانات بالكامل', 'ثيمات حصرية للتطبيق'].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="text-brand-gold w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-semibold">{feature}</span>
              </li>
            ))}
          </ul>
          <button className="w-full bg-brand-gold text-brand-dark font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95">
            الترقية الآن
          </button>
        </motion.div>
      ) : (
        <div className="bg-brand-emerald-light/50 border border-brand-gold/30 p-6 rounded-3xl mb-8 flex items-center justify-center flex-col text-center">
          <ShieldCheck className="w-12 h-12 text-brand-gold mb-3" />
          <h2 className="text-xl font-bold mb-1 text-white">أهلاً بك في العضوية المميزة</h2>
          <p className="text-sm text-slate-300">تم تفعيل جميع الميزات بنجاح</p>
        </div>
      )}

      {/* Admin Dashboard */}
      {profile?.role === 'admin' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <ShieldCheck className="text-brand-gold" />
            لوحة الإدارة
          </h2>
          <div className="space-y-3">
            {usersList.map((u) => (
              <div key={u.id} className="bg-brand-emerald-light/60 p-4 rounded-2xl border border-brand-gold/10 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-200">{u.displayName || 'بدون اسم'}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value)}
                    disabled={u.id === user.uid}
                    className="text-xs bg-brand-emerald border-none rounded-lg px-2 py-1 outline-none text-slate-300"
                  >
                    <option value="user">عضو عادي</option>
                    <option value="vip">VIP</option>
                    <option value="admin">مدير</option>
                  </select>
                  <button 
                    onClick={() => toggleBan(u.id, u.isBanned)}
                    disabled={u.id === user.uid}
                    className={clsx(
                      "p-2 rounded-lg transition-colors border",
                      u.isBanned 
                        ? "bg-red-900/30 text-red-400 border-red-500/30" 
                        : "bg-brand-emerald text-slate-500 hover:text-red-400 border-transparent"
                    )}
                  >
                    <UserX size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
