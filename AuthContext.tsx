import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

interface ReadingProgress {
  lastReadSurah: number;
  lastReadAyah: number;
  lastReadPage: number;
  userId?: string;
  updatedAt: any;
}

interface UserProfile {
  role: 'user' | 'vip' | 'admin';
  isBanned: boolean;
  displayName?: string;
  email?: string;
  muezzinId?: string;
  locationId?: string;
  notificationBackground?: string;
  notificationName?: string;
  notificationSound?: string;
  socialMediaLink?: string;
  trialUsed?: boolean;
  trialExpiry?: any;
}

import { translations } from '../lib/translations';

// ... (keep importing everything else)

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  readingProgress: ReadingProgress | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateMuezzin: (muezzinId: string) => Promise<void>;
  updateLocation: (locationId: string) => Promise<void>;
  updateNotificationSettings: (notificationBackground: string, notificationName: string, notificationSound: string) => Promise<void>;
  updateSocialMediaLink: (socialMediaLink: string) => Promise<void>;
  updateProgress: (progress: Omit<ReadingProgress, 'updatedAt' | 'userId'>) => Promise<void>;
  activateTrial: () => Promise<void>;
  activeNotification: { title: string, backgroundUrl: string } | null;
  setActiveNotification: (notification: { title: string, backgroundUrl: string } | null) => void;
  showNotification: (title: string, body: string) => Promise<void>;
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  t: (key: keyof typeof translations.ar) => string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  readingProgress: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
  updateMuezzin: async () => {},
  updateLocation: async () => {},
  updateNotificationSettings: async () => {},
  updateSocialMediaLink: async () => {},
  updateProgress: async () => {},
  activateTrial: async () => {},
  activeNotification: null,
  setActiveNotification: () => {},
  showNotification: async () => {},
  darkMode: false,
  toggleDarkMode: () => {},
  language: 'ar',
  setLanguage: () => {},
  t: (key) => key,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') !== 'false');
  const [language, setLanguage] = useState<'ar' | 'en'>(() => (localStorage.getItem('language') as 'ar' | 'en') || 'ar');
  const [activeNotification, setActiveNotification] = useState<{ title: string, backgroundUrl: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const t = (key: keyof typeof translations.ar) => translations[language][key] || key;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const progressRef = doc(db, 'users', firebaseUser.uid, 'progress', 'lastRead');
          
          let userSnap, progressSnap;
          try {
            [userSnap, progressSnap] = await Promise.all([
               getDoc(userRef),
               getDoc(progressRef)
            ]);
          } catch (e) {
            handleFirestoreError(e, OperationType.GET, `users/${firebaseUser.uid}`);
            throw e;
          }

          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            console.log('Loaded profile data:', data);
            if (!data.role) {
                console.error('Data loaded has no role, fixing to user:', data);
                data.role = 'user';
            }
            if (firebaseUser.email === 'hananbouzittt@gmail.com' && data.role !== 'admin') {
              try {
                await updateDoc(userRef, { role: 'admin', updatedAt: serverTimestamp() });
                data.role = 'admin'; // Update local data object
                console.log('Upgraded to admin');
              } catch (e) {
                console.error('Failed to auto-upgrade to admin:', e);
              }
            } else if (firebaseUser.email === 'hananbouzittt@gmail.com') {
                console.log('User is admin already:', data.role);
            } else {
                console.log('User is not admin, email:', firebaseUser.email);
            }
            setProfile(data);
          } else {
            // First time login
            const isAdmin = firebaseUser.email === 'hananbouzittt@gmail.com';
            const newProfile = {
              userId: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: isAdmin ? 'admin' : 'user',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              isBanned: false,
              trialUsed: false,
              trialExpiry: null,
              ...(firebaseUser.displayName && { displayName: firebaseUser.displayName })
            };
            try {
              await setDoc(userRef, newProfile);
            } catch (e) {
              handleFirestoreError(e, OperationType.CREATE, `users/${firebaseUser.uid}`);
              throw e;
            }
            setProfile({ role: isAdmin ? 'admin' : 'user', isBanned: false, trialUsed: false, trialExpiry: null, displayName: firebaseUser.displayName || undefined, email: firebaseUser.email || undefined });
          }

          if (progressSnap.exists()) {
            setReadingProgress(progressSnap.data() as ReadingProgress);
          }
        } catch (error) {
          // Handled or logged inside inner blocks
        }
      } else {
        setProfile(null);
        setReadingProgress(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateMuezzin = async (muezzinId: string) => {
    if (!user || !profile) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { muezzinId, updatedAt: serverTimestamp() });
      setProfile({ ...profile, muezzinId });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateLocation = async (locationId: string) => {
    if (!user || !profile) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { locationId, updatedAt: serverTimestamp() });
      setProfile({ ...profile, locationId });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateNotificationSettings = async (notificationBackground: string, notificationName: string, notificationSound: string) => {
    if (!user || !profile) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { notificationBackground, notificationName, notificationSound, updatedAt: serverTimestamp() });
      setProfile({ ...profile, notificationBackground, notificationName, notificationSound });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateSocialMediaLink = async (socialMediaLink: string) => {
    if (!user || !profile) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { socialMediaLink, updatedAt: serverTimestamp() });
      setProfile({ ...profile, socialMediaLink });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateProgress = async (progress: Omit<ReadingProgress, 'updatedAt' | 'userId'>) => {
    if (!user) return;
    try {
      const progressRef = doc(db, 'users', user.uid, 'progress', 'lastRead');
      await setDoc(progressRef, { 
        ...progress, 
        userId: user.uid,
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/progress/lastRead`);
    }
  };

  const activateTrial = async () => {
    if (!user || !profile || profile.trialUsed) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const trialDuration = 24 * 60 * 60 * 1000;
      const expiryDate = new Date(Date.now() + trialDuration);
      
      await updateDoc(userRef, { 
        role: 'vip', 
        trialUsed: true, 
        trialExpiry: expiryDate,
        updatedAt: serverTimestamp() 
      });
      setProfile({ ...profile, role: 'vip', trialUsed: true, trialExpiry: expiryDate });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const showNotification = async (title: string, body: string) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, readingProgress, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, updateMuezzin, updateLocation, updateNotificationSettings, updateSocialMediaLink, updateProgress, activateTrial, activeNotification, setActiveNotification, darkMode, toggleDarkMode, language, setLanguage, t, showNotification }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
