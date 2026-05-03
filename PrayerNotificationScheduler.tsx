import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Howl } from 'howler';
import { LOCATIONS } from '../constants';

const PRAYER_KEYS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export function PrayerNotificationScheduler() {
  const { profile, setActiveNotification } = useAuth();
  const [lastNotified, setLastNotified] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.locationId) return;

    const checkPrayerTimes = async () => {
      const now = new Date();
      const todayStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
      const locationData = LOCATIONS.find(l => l.id === profile.locationId) || LOCATIONS[0];
      
      try {
        const response = await fetch(`https://api.aladhan.com/v1/timings/${todayStr}?latitude=${locationData.lat}&longitude=${locationData.lng}&method=${locationData.method}`);
        const data = await response.json();
        
        if (data.code === 200) {
          const timings = data.data.timings;
          
          PRAYER_KEYS.forEach(prayer => {
            const timeStr = timings[prayer];
            const [hours, minutes] = timeStr.split(':').map(Number);
            const prayerTime = new Date(now);
            prayerTime.setHours(hours, minutes, 0, 0);

            // Check if it's time (within 1 minute) and not already notified
            if (Math.abs(now.getTime() - prayerTime.getTime()) < 60000 && lastNotified !== `${todayStr}-${prayer}`) {
              
              // Trigger Notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`حان الآن وقت صلاة ${prayer}`, {
                  body: 'حان الآن وقت الصلاة، تقبل الله منا ومنكم.',
                  icon: '/logo.png' // Ensure this exists or use a default
                });
              }

              // Set active notification in context
              setActiveNotification({
                  title: `حان الآن وقت صلاة ${prayer}`,
                  backgroundUrl: profile?.notificationBackground || 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?q=80&w=2071&auto=format&fit=crop'
              });

              // Play Adhan
              const audioUrl = profile?.notificationSound === 'madinah' ? 'https://cdn.aladhan.com/audio/adhans/madinah.mp3' : (profile?.notificationSound === 'makkah' ? 'https://cdn.aladhan.com/audio/adhans/makkah.mp3' : 'https://cdn.aladhan.com/audio/adhans/a9.mp3'); 
              const sound = new Howl({
                src: [audioUrl],
                html5: true,
              });
              sound.play();
              
              setLastNotified(`${todayStr}-${prayer}`);
            }
          });
        }
      } catch (err) {
        console.error("Failed to check prayer times", err);
      }
    };

    const interval = setInterval(checkPrayerTimes, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [profile?.locationId, lastNotified]);

  return null;
}
