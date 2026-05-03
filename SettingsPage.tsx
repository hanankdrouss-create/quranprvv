import React, { useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { LogOut, Shield, Globe, Moon, Sun, Volume2, Info, Lock, ChevronRight, Youtube } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, logout, updateMuezzin, updateNotificationSettings, updateSocialMediaLink, darkMode, toggleDarkMode, language, setLanguage, t, showNotification, loading } = useAuth();

  console.log('SettingsPage Render - Profile:', profile);

  useEffect(() => {
    console.log('DEBUG SettingsPage - User Email:', user?.email);
    console.log('DEBUG SettingsPage - Profile Role:', profile?.role);
  }, [user, profile]);

  const handleMuezzinChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await updateMuezzin(e.target.value);
  };

  if (loading) return <div className="p-6">{t('loading')}...</div>;

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 font-arabic">{t('settings')}</h1>
      
      <div className="bg-slate-100 dark:bg-brand-emerald/50 p-4 rounded-xl border border-black/10 dark:border-white/10 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <img 
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}&background=D4AF37&color=020D06`} 
            alt="Profile" 
            className="w-16 h-16 rounded-full border-2 border-brand-gold"
          />
          <div>
            <h2 className="font-bold text-lg">{user?.displayName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-brand-gold text-sm font-semibold capitalize">
          <Shield size={16} />
          <span>{profile?.role}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="space-y-3">
          <h3 className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">{t('general')}</h3>
          <div className="flex items-center justify-between bg-slate-100 dark:bg-brand-emerald-light/30 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Globe size={20} />
              <span>{t('language')}</span>
            </div>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
              className="bg-white dark:bg-brand-dark rounded-lg p-2 text-sm border border-black/10 dark:border-white/10"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="flex items-center justify-between bg-slate-100 dark:bg-brand-emerald-light/30 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              <span>{t('darkMode')}</span>
            </div>
            <button 
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full p-1 transition ${darkMode ? 'bg-white' : 'bg-green-600'}`}
            >
              <div className={`w-4 h-4 rounded-full ${darkMode ? 'bg-black' : 'bg-white'} transition ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Prayer Settings */}
        <div className="space-y-3">
          <h3 className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">{t('prayer')}</h3>
          <div className="flex items-center justify-between bg-slate-100 dark:bg-brand-emerald-light/30 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Volume2 size={20} />
              <span>{t('azanSound')}</span>
            </div>
            <select 
              value={profile?.muezzinId || 'makkah'} 
              onChange={handleMuezzinChange}
              className="bg-white dark:bg-brand-dark rounded-lg p-2 text-sm border border-black/10 dark:border-white/10"
            >
              <option value="makkah">مكة المكرمة</option>
              <option value="madinah">المدينة المنورة</option>
              <option value="al-aqsa">القدس الشريف</option>
            </select>
          </div>
          
          {/* VIP Notification Settings */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                  <Shield size={20} className="text-brand-gold" />
                  <span className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">Custom Notification <span className="text-[10px] bg-brand-gold text-white px-1.5 py-0.5 rounded-full font-sans font-bold">VIP</span></span>
              </div>
              { (profile?.role?.trim() === 'vip' || profile?.role?.trim() === 'admin' || user?.email === 'hananbouzittt@gmail.com') ? (
                  <div className="space-y-4">
                      {/* VIP content */}
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Background URL</label>
                      <input 
                        type="text" 
                        placeholder="Background URL" 
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white"
                        value={profile?.notificationBackground || ''}
                        onChange={(e) => updateNotificationSettings(e.target.value, profile?.notificationName || '', profile?.notificationSound || 'default')}
                      />
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Label</label>
                      <input 
                        type="text" 
                        placeholder="Label" 
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white"
                        value={profile?.notificationName || ''}
                        onChange={(e) => updateNotificationSettings(profile?.notificationBackground || '', e.target.value, profile?.notificationSound || 'default')}
                      />
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <h4 className="text-sm font-bold mb-2 text-gray-900 dark:text-white">تخصيص صوت التنبيه</h4>
                        <select 
                          className="w-full p-3 mb-4 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white"
                          value={profile?.notificationSound || 'default'}
                          onChange={(e) => updateNotificationSettings(profile?.notificationBackground || '', profile?.notificationName || '', e.target.value)}
                        >
                            <option value="default">صوت الأذان الافتراضي</option>
                            <option value="madinah">صوت المدينة</option>
                            <option value="makkah">صوت مكة</option>
                        </select>
                        <button 
                          onClick={() => showNotification(profile?.notificationName || 'تنبيه الأذان', 'هذا تنبيه تجريبي للأذان')}
                          className="w-full p-3 rounded-lg bg-brand-gold text-white text-sm font-bold hover:bg-brand-gold-light transition"
                        >
                            معاينة التنبيه
                        </button>
                      </div>

                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Social Media Link</label>
                      <input 
                        type="text" 
                        placeholder="رابط القناة الرسمية / التواصل الاجتماعي" 
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white"
                        value={profile?.socialMediaLink || ''}
                        onChange={(e) => updateSocialMediaLink(e.target.value)}
                      />
                  </div>
              ) : (
                  <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg font-bold border border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                      {t('vipRequired')}
                  </div>
              )}
          </div>
        </div>

        {/* App Info */}
        <div className="space-y-3">
          <h3 className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">{t('appInfo')}</h3>
          <button className="w-full flex items-center justify-between bg-slate-100 dark:bg-brand-emerald-light/30 p-4 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition">
            <div className="flex items-center gap-3">
              <Info size={20} />
              <span>{t('aboutApp')}</span>
            </div>
            <ChevronRight size={16} />
          </button>
          <button className="w-full flex items-center justify-between bg-slate-100 dark:bg-brand-emerald-light/30 p-4 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition">
            <div className="flex items-center gap-3">
              <Lock size={20} />
              <span>{t('privacyPolicy')}</span>
            </div>
            <ChevronRight size={16} />
          </button>
          <a href="https://www.youtube.com/@Quran_mpp" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between bg-slate-100 dark:bg-brand-emerald-light/30 p-4 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition">
            <div className="flex items-center gap-3">
              <Youtube size={20} className="text-red-600" />
              <span>قناتي الرسمية</span>
            </div>
            <ChevronRight size={16} />
          </a>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={20} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}
