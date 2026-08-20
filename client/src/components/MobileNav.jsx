import React from 'react';
import { Home, Compass, Search, Library, Download } from 'lucide-react';

export default function MobileNav({ currentView, setView, setViewParams }) {
  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'downloads', label: 'Downloads', icon: Download }
  ];

  return (
    <nav className="glass-panel mobile-nav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      borderTop: '1px solid var(--divider)',
      paddingBottom: 'safe-area-inset-bottom', // iOS compatibility
      zIndex: 100,
      backdropFilter: 'blur(20px)'
    }}>
      {items.map(item => {
        const Icon = item.icon;
        const isActive = currentView === item.id || 
          (item.id === 'library' && ['liked', 'playlist'].includes(currentView));
        
        return (
          <button
            key={item.id}
            onClick={() => { setView(item.id); setViewParams({}); }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              border: 'none',
              background: 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: isActive ? '700' : '500',
              padding: '6px 12px',
              width: '60px',
              transition: 'var(--transition)'
            }}
          >
            <Icon size={20} color={isActive ? 'var(--accent)' : 'var(--text-secondary)'} style={{
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease',
              filter: isActive ? 'drop-shadow(0 0 4px var(--accent-glow))' : 'none'
            }} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
