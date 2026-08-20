import React, { useState } from 'react';
import { Home, Compass, Search, Library, Heart, Download, Settings, User, PlusCircle, LogOut, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getTranslation } from '../services/translations';

export default function Sidebar({ currentView, setView, setViewParams, userPlaylists, refreshPlaylists }) {
  const { user, logout, language } = useAuth();
  const t = (key) => getTranslation(language, key);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showModal, setShowModal] = useState(false);

  const navItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'discover', label: t('discover'), icon: Compass },
    { id: 'search', label: t('search'), icon: Search },
    { id: 'library', label: t('library'), icon: Library },
    { id: 'liked', label: t('likedSongs'), icon: Heart },
    { id: 'downloads', label: t('downloads'), icon: Download },
  ];

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    try {
      await api.createPlaylist(newPlaylistName, 'My custom Astro playlist');
      setNewPlaylistName('');
      setShowModal(false);
      refreshPlaylists();
    } catch (err) {
      console.error('Failed to create playlist', err);
    }
  };

  return (
    <aside className="glass-panel" style={{
      width: '260px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--divider)',
      padding: '24px 16px',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignUse: 'center', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px var(--accent-glow)'
        }}>
          <Music size={18} color="white" />
        </div>
        <div>
          <span style={{ fontSize: '18px', fontWeight: '800', tracking: '-0.02em', background: 'linear-gradient(to right, #FFFFFF, var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ASTRO PLAYER
          </span>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.1em', marginTop: '-2px' }}>
            YOUR SOUND. YOUR UNIVERSE.
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setViewParams({}); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: isActive ? '700' : '500',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'var(--transition)',
                boxShadow: isActive ? 'inset 2px 0 0 var(--accent)' : 'none'
              }}
              className={isActive ? 'neon-glow' : ''}
            >
              <Icon size={18} color={isActive ? 'var(--accent)' : 'var(--text-secondary)'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Playlist Section Divider */}
      <div style={{ height: '1px', background: 'var(--divider)', margin: '20px 0' }} />

      {/* Playlists Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 8px 8px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          {t('playlists')}
        </span>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          title={t('createPlaylist')}
        >
          <PlusCircle size={16} />
        </button>
      </div>

      {/* Playlists Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 4px' }}>
        {userPlaylists.map(pl => (
          <button
            key={pl.id}
            onClick={() => { setView('playlist'); setViewParams({ id: pl.id }); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: currentView === 'playlist' && pl.id === pl.id ? 'transparent' : 'transparent', // controlled dynamically
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '13px',
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => { e.target.style.color = 'var(--text-primary)'; e.target.style.paddingLeft = '16px'; }}
            onMouseLeave={(e) => { e.target.style.color = 'var(--text-secondary)'; e.target.style.paddingLeft = '12px'; }}
          >
            <span style={{ color: 'var(--accent)', marginRight: '4px' }}>•</span>
            {pl.name}
          </button>
        ))}
        {userPlaylists.length === 0 && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '8px 12px', fontStyle: 'italic' }}>
            No playlists created
          </span>
        )}
      </div>

      {/* Settings & Profile Footer */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={() => { setView('profile'); setViewParams({}); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: currentView === 'profile' ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
            color: currentView === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: '14px',
            textAlign: 'left',
            fontWeight: currentView === 'profile' ? '700' : '500'
          }}
        >
          <User size={18} />
          {user?.username || 'Profile'}
        </button>

        <button
          onClick={() => { setView('settings'); setViewParams({}); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: currentView === 'settings' ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
            color: currentView === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: '14px',
            textAlign: 'left',
            fontWeight: currentView === 'settings' ? '700' : '500'
          }}
        >
          <Settings size={18} />
          {t('settings')}
        </button>

        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: 'transparent',
            color: 'var(--error)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: '14px',
            textAlign: 'left',
            fontWeight: '500'
          }}
        >
          <LogOut size={18} />
          {t('logout')}
        </button>
      </div>

      {/* Create Playlist Overlay Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{
            width: '380px',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Create New Playlist</h3>
            <form onSubmit={handleCreatePlaylist}>
              <input
                type="text"
                placeholder="Playlist name"
                className="input-field"
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                autoFocus
                style={{ marginBottom: '20px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { setShowModal(false); setNewPlaylistName(''); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
