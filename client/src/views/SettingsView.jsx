import React, { useState } from 'react';
import { Settings, User, Sliders, Palette, Info, Globe, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../services/translations';

export default function SettingsView({ setView }) {
  const { user, settings, updateSettings, language, changeLanguage } = useAuth();
  const [crossfade, setCrossfade] = useState(settings.playback_crossfade || 0);

  const t = (key) => getTranslation(language, key);

  const handleCrossfadeChange = (e) => {
    const val = parseInt(e.target.value);
    setCrossfade(val);
    updateSettings({ playback_crossfade: val });
  };

  const handleWifiToggle = (e) => {
    updateSettings({ wifi_only: e.target.checked ? 1 : 0 });
  };

  const handleQualityChange = (e) => {
    updateSettings({ download_quality: e.target.value });
  };

  const handleThemeChange = (color) => {
    updateSettings({ theme_color: color });
    const colors = {
      blue: { primary: '#2563EB', accent: '#3B82F6', glow: 'rgba(59,130,246,0.35)' },
      purple: { primary: '#7C3AED', accent: '#A78BFA', glow: 'rgba(167,139,250,0.35)' },
      green: { primary: '#059669', accent: '#10B981', glow: 'rgba(16,185,129,0.35)' },
      pink: { primary: '#DB2777', accent: '#F472B6', glow: 'rgba(244,114,182,0.35)' }
    };
    
    const choice = colors[color] || colors.blue;
    document.documentElement.style.setProperty('--primary', choice.primary);
    document.documentElement.style.setProperty('--accent', choice.accent);
    document.documentElement.style.setProperty('--accent-glow', choice.glow);
  };

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={24} color="var(--accent)" />
          {t('settings')}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Configure playback, downloads, and themes
        </p>
      </div>

      {/* Language settings */}
      <section className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '15px', color: 'white', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--divider)', paddingBottom: '8px' }}>
          <Globe size={16} color="var(--text-secondary)" />
          {t('language')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('selectLanguage')}</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => changeLanguage('en')}
              className="btn"
              style={{
                backgroundColor: language === 'en' ? 'var(--primary)' : 'var(--bg-secondary)',
                color: 'white',
                border: language === 'en' ? 'none' : '1px solid var(--divider)',
                padding: '8px 18px',
                fontSize: '13px',
                borderRadius: 'var(--radius-md)'
              }}
            >
              English
            </button>
            <button
              onClick={() => changeLanguage('ta')}
              className="btn"
              style={{
                backgroundColor: language === 'ta' ? 'var(--primary)' : 'var(--bg-secondary)',
                color: 'white',
                border: language === 'ta' ? 'none' : '1px solid var(--divider)',
                padding: '8px 18px',
                fontSize: '13px',
                borderRadius: 'var(--radius-md)'
              }}
            >
              தமிழ் (Tamil)
            </button>
          </div>
        </div>
      </section>

      {/* Data & Cache */}
      <section className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '15px', color: 'white', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--divider)', paddingBottom: '8px' }}>
          <Database size={16} color="var(--text-secondary)" />
          Data & Cache
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Monitor YouTube API quota usage and manage your 7-day cached music catalog.
          </span>
          <button
            onClick={() => setView('cache')}
            className="btn btn-secondary"
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              width: 'fit-content'
            }}
          >
            Manage Cache & API Metrics
          </button>
        </div>
      </section>

      {/* Account Settings */}
      <section className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '15px', color: 'white', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--divider)', paddingBottom: '8px' }}>
          <User size={16} color="var(--text-secondary)" />
          Account Profile
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Username</span>
            <div style={{ fontSize: '14px', color: 'white', fontWeight: '600', marginTop: '2px' }}>{user?.username}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email address</span>
            <div style={{ fontSize: '14px', color: 'white', fontWeight: '600', marginTop: '2px' }}>{user?.email}</div>
          </div>
        </div>
      </section>

      {/* Playback Controls */}
      <section className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '15px', color: 'white', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--divider)', paddingBottom: '8px' }}>
          <Sliders size={16} color="var(--text-secondary)" />
          Playback Preferences
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Crossfade slider */}
          <div>
            <div style={{ display: 'flex', justify: 'space-between', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>Crossfade Transition</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent)' }}>{crossfade} seconds</span>
            </div>
            <input 
              type="range"
              min={0}
              max={12}
              value={crossfade}
              onChange={handleCrossfadeChange}
              style={{
                width: '100%',
                accentColor: 'var(--accent)',
                height: '4px',
                borderRadius: '2px',
                cursor: 'pointer',
                outline: 'none'
              }}
            />
          </div>

          {/* Autoplay toggler */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--divider)', paddingTop: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>Autoplay similar content</span>
            <input type="checkbox" defaultChecked style={{ width: '38px', height: '18px', accentColor: 'var(--accent)' }} />
          </div>

          {/* Volume normalization */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>Normalize volume levels</span>
            <input type="checkbox" defaultChecked style={{ width: '38px', height: '18px', accentColor: 'var(--accent)' }} />
          </div>
        </div>
      </section>

      {/* Appearance customizations */}
      <section className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '15px', color: 'white', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--divider)', paddingBottom: '8px' }}>
          <Palette size={16} color="var(--text-secondary)" />
          {t('cosmicTheme')}
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '12px' }}>{t('accentColor')}:</span>
        <div style={{ display: 'flex', gap: '14px' }}>
          {[
            { id: 'blue', color: '#3B82F6' },
            { id: 'purple', color: '#A78BFA' },
            { id: 'green', color: '#10B981' },
            { id: 'pink', color: '#F472B6' }
          ].map(theme => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: theme.color,
                border: settings.theme_color === theme.id ? '2.5px solid white' : 'none',
                cursor: 'pointer',
                boxShadow: settings.theme_color === theme.id ? `0 0 12px ${theme.color}` : 'none',
                transition: 'var(--transition)'
              }}
              title={`${theme.id} accent`}
            />
          ))}
        </div>
      </section>

      {/* About Box */}
      <section className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '15px', color: 'white', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--divider)', paddingBottom: '8px' }}>
          <Info size={16} color="var(--text-secondary)" />
          {t('aboutTitle')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div>{t('versionLabel')}: <span style={{ color: 'white', fontWeight: '700' }}>v1.0.0 (Cosmic Edition)</span></div>
          <div>{t('buildEnv')}: <span style={{ color: 'var(--accent)', fontWeight: '700' }}>Node.js / React / SQLite3</span></div>
          <div style={{ height: '1px', background: 'var(--divider)', margin: '6px 0' }} />
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); alert(t('terms')); }}>{t('terms')}</a>
            <span>•</span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert(t('privacy')); }}>{t('privacy')}</a>
            <span>•</span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert(t('licenses')); }}>{t('licenses')}</a>
          </div>
        </div>
      </section>

    </div>
  );
}
