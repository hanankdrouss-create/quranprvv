import React, { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Home, BookOpen, Compass, Heart, User, Crown, Bell, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { TrialBanner } from './TrialBanner';
import { LoginModal } from './LoginModal';
import { PrayerNotificationScheduler } from './PrayerNotificationScheduler';
import { NotificationOverlay } from './NotificationOverlay';

export default function Layout() {
  const { user, profile, logout, darkMode, language, t } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const navItems = [
    { to: "/", icon: Home, label: t('home') },
    { to: "/quran", icon: BookOpen, label: t('quran') },
    { to: "/qibla", icon: Compass, label: t('qibla') },
    { to: "/adhkar", icon: Heart, label: t('adhkar') },
    { to: "/settings", icon: Settings, label: t('settings') },
  ];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  if (profile?.isBanned) {
    return (
      <div className="min-h-screen bg-brand-dark text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold mb-4 font-arabic">تم حظرك</h1>
        <p className="mb-8 text-brand-gold">يرجى التواصل مع الإدارة لاستعادة حسابك</p>
        <div className="flex flex-col gap-4 mt-8">
          <a href="mailto:admin@example.com" className="bg-brand-gold text-brand-dark px-6 py-2 rounded-full font-bold">تواصل عبر البريد الإلكتروني</a>
          <button onClick={logout} className="bg-red-500/20 text-red-400 px-6 py-2 rounded-full font-bold">تسجيل الخروج</button>
        </div>
      </div>
    );
  }

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={`min-h-screen bg-background text-foreground flex flex-col font-sans custom-bg ${darkMode ? 'dark' : ''}`}>

      {/* Top Bar */}
      <header className="p-4 flex justify-between items-center z-50 fixed w-full max-w-md mx-auto top-0 left-1/2 -translate-x-1/2 bg-brand-emerald/90 backdrop-blur-md border-b border-brand-gold/20">
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 cursor-pointer" onClick={logout}>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=D4AF37&color=020D06`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-brand-gold"
              />
              <div className="hidden sm:block">
                <p className="text-sm rounded font-bold text-white leading-none">{user.displayName || user.email}</p>
                <p className="text-xs text-brand-gold-light opacity-80 mt-1 capitalize">{profile?.role}</p>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 bg-brand-gold text-brand-dark px-4 py-2 rounded-full text-sm font-bold hover:opacity-90 shadow-lg shadow-brand-gold/20 transition-all"
            >
              <User size={16} />
              <span>تسجيل الدخول</span>
            </button>
          )}
        </div>
        
        <NavLink to="/vip" className="text-brand-gold flex items-center gap-1 hover:text-brand-gold-light transition-colors">
          <Crown size={20} />
          <span className="font-bold hidden sm:inline">VIP</span>
        </NavLink>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto w-full pb-20 pt-20">
        <PrayerNotificationScheduler />
        <NotificationOverlay />
        <div className="max-w-md mx-auto h-full w-full relative">
           <TrialBanner />
           <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
           <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full left-0 right-0 z-50 bg-brand-emerald-light/60 backdrop-blur-lg border-t border-white/5 px-6 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center h-12 relative">
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to}
              className={({isActive}) => `flex flex-1 flex-col items-center justify-center h-full transition-all duration-300 ${isActive ? 'text-brand-gold' : 'text-slate-400 hover:text-white'}`}
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                    {isActive && (
                       <motion.span 
                         layoutId="nav-indicator"
                         className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-gold"
                       />
                    )}
                  </div>
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
