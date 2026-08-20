import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('astro_token'));
  const [language, setLanguage] = useState(localStorage.getItem('astro_language') || 'en');
  const [settings, setSettings] = useState({
    playback_crossfade: 0,
    wifi_only: 0,
    download_quality: 'High',
    theme_color: 'blue'
  });

  useEffect(() => {
    if (language === 'ta') {
      document.body.classList.add('tamil-font');
    } else {
      document.body.classList.remove('tamil-font');
    }
  }, [language]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('astro_language', lang);
  };
  const [stats, setStats] = useState({
    likedSongs: 0,
    playlists: 0,
    songsPlayed: 0,
    minutesListened: 0,
    downloads: 0
  });
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token exists
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const data = await api.getProfile();
          setUser(data.user);
          setSettings(data.settings);
          setStats(data.stats);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          if (err.message === 'Invalid or expired token') {
            logout();
          }
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  // Force reload profile stats & settings
  const refreshProfile = async () => {
    if (!token) return;
    try {
      const data = await api.getProfile();
      setUser(data.user);
      setSettings(data.settings);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('astro_token', res.token);
      setToken(res.token);
      setUser(res.user);
      await refreshProfile();
      return res.user;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const res = await api.register(username, email, password);
      localStorage.setItem('astro_token', res.token);
      setToken(res.token);
      setUser(res.user);
      await refreshProfile();
      return res.user;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('astro_token');
    setToken(null);
    setUser(null);
    setStats({
      likedSongs: 0,
      playlists: 0,
      songsPlayed: 0,
      minutesListened: 0,
      downloads: 0
    });
  };

  const updateSettings = async (newSettings) => {
    try {
      const res = await api.updateSettings(newSettings);
      setSettings(res.settings);
      return res.settings;
    } catch (err) {
      console.error('Failed to update settings:', err);
      // Fallback update in state if offline
      setSettings(prev => ({ ...prev, ...newSettings }));
      throw err;
    }
  };

  const value = {
    user,
    token,
    settings,
    stats,
    loading,
    language,
    changeLanguage,
    login,
    register,
    logout,
    updateSettings,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
