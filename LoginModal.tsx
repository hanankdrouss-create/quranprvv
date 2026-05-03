import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { X, Mail, Lock, User } from 'lucide-react';

export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ ما');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-brand-dark p-6 rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold font-arabic">{isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="email" 
              placeholder="البريد الإلكتروني" 
              className="w-full p-2 pl-10 rounded-lg bg-slate-100 dark:bg-slate-800 border-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              className="w-full p-2 pl-10 rounded-lg bg-slate-100 dark:bg-slate-800 border-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-brand-emerald text-white p-2 rounded-lg font-bold">
            {isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-4 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-brand-emerald dark:text-brand-gold">
                {isSignUp ? 'لديك حساب فعلياً؟ سجل دخولك' : 'لا تملك حساباً؟ أنشئ حساباً جديداً'}
            </button>
        </div>

        <div className="my-4 border-t border-slate-200 dark:border-slate-700"></div>
        
        <button 
          onClick={() => { signInWithGoogle(); onClose(); }}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-300 dark:border-slate-600"
        >
          <User size={18} />
          تسجيل الدخول باستخدام جوجل
        </button>
      </div>
    </div>
  );
}
