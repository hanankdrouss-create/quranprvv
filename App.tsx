import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import Layout from './components/Layout';
import WelcomePage from './pages/WelcomePage';
import HomePage from './pages/HomePage';
import QuranPage from './pages/QuranPage';
import QiblaPage from './pages/QiblaPage';
import AdhkarPage from './pages/AdhkarPage';
import VIPPage from './pages/VIPPage';
import RemindersPage from './pages/RemindersPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="quran" element={<QuranPage />} />
            <Route path="qibla" element={<QiblaPage />} />
            <Route path="adhkar" element={<AdhkarPage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="vip" element={<VIPPage />} />
          </Route>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
