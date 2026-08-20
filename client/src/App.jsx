import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { usePlayback } from './context/PlaybackContext';
import { api } from './services/api';

// Views
import Splash from './views/Splash';
import Onboarding from './views/Onboarding';
import Auth from './views/Auth';
import Home from './views/Home';
import Search from './views/Search';
import Discover from './views/Discover';
import PlaylistView from './views/PlaylistView';
import LikedSongs from './views/LikedSongs';
import DownloadsView from './views/DownloadsView';
import ProfileView from './views/ProfileView';
import SettingsView from './views/SettingsView';
import ArtistView from './views/ArtistView';

// Layout Components
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import MiniPlayer from './components/MiniPlayer';
import FullPlayer from './components/FullPlayer';

export default function App() {
  const { user, token, loading } = useAuth();
  
  // App Boot Sequence States
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem('astro_onboarded')
  );

  // Router State
  const [view, setView] = useState('home');
  const [viewParams, setViewParams] = useState({});
  const [navigationHistory, setNavigationHistory] = useState(['home']);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);

  // Fetch playlists owned by user
  const loadPlaylists = async () => {
    if (!token) return;
    try {
      const res = await api.getPlaylists();
      setPlaylists(res.playlists || []);
    } catch (e) {
      console.warn('Could not load user playlists', e);
    }
  };

  useEffect(() => {
    if (token) {
      loadPlaylists();
    }
  }, [token]);

  // Navigate view & track history
  const navigateToView = (newView, params = {}) => {
    setView(newView);
    setViewParams(params);
    setNavigationHistory(prev => {
      // Prevent consecutive duplicates
      if (prev[prev.length - 1] === newView) return prev;
      return [...prev, newView];
    });
  };

  const handleBackNavigation = () => {
    if (navigationHistory.length <= 1) return;
    const nextHistory = [...navigationHistory];
    nextHistory.pop(); // remove current
    const previousView = nextHistory[nextHistory.length - 1] || 'home';
    
    setNavigationHistory(nextHistory);
    setView(previousView);
  };

  // Render view controller
  const renderView = () => {
    switch (view) {
      case 'home':
        return <Home setView={navigateToView} setViewParams={setViewParams} userPlaylists={playlists} refreshPlaylists={loadPlaylists} />;
      case 'search':
        return <Search setView={navigateToView} setViewParams={setViewParams} userPlaylists={playlists} refreshPlaylists={loadPlaylists} />;
      case 'discover':
        return <Discover setView={navigateToView} setViewParams={setViewParams} />;
      case 'playlist':
        return <PlaylistView playlistId={viewParams.id} setView={navigateToView} setViewParams={setViewParams} refreshPlaylists={loadPlaylists} />;
      case 'liked':
        return <LikedSongs setView={navigateToView} setViewParams={setViewParams} />;
      case 'downloads':
        return <DownloadsView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      case 'artist':
        return <ArtistView artistName={viewParams.name} artistImage={viewParams.image} setView={navigateToView} />;
      default:
        return <Home setView={navigateToView} setViewParams={setViewParams} userPlaylists={playlists} refreshPlaylists={loadPlaylists} />;
    }
  };

  // Finish introductory screens
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('astro_onboarded', 'true');
    setShowOnboarding(false);
  };

  if (loading) {
    return <Splash onFinish={handleSplashFinish} />;
  }

  if (showSplash) {
    return <Splash onFinish={handleSplashFinish} />;
  }

  if (!token) {
    return <Auth />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="app-container">
      {/* 1. Desktop Left Sidebar */}
      <div className="desktop-sidebar-only" style={{ height: '100%' }}>
        <Sidebar 
          currentView={view} 
          setView={navigateToView} 
          setViewParams={setViewParams} 
          userPlaylists={playlists} 
          refreshPlaylists={loadPlaylists} 
        />
      </div>

      {/* 2. Main content display box */}
      <main className="main-content">
        {renderView()}
      </main>

      {/* 3. Responsive Playback controls */}
      <MiniPlayer 
        onExpand={() => setPlayerOpen(true)}
        onToggleQueue={() => setPlayerOpen(true)}
        onToggleLyrics={() => setPlayerOpen(true)}
      />

      {/* 4. Mobile Bottom navigation */}
      <MobileNav 
        currentView={view} 
        setView={navigateToView} 
        setViewParams={setViewParams} 
      />

      {/* 5. Full screen media dashboard overlay */}
      <FullPlayer 
        isOpen={playerOpen} 
        onClose={() => setPlayerOpen(false)} 
        userPlaylists={playlists} 
        refreshPlaylists={loadPlaylists} 
      />

      {/* Embedded CSS grid alignments for responsive sidebar layout toggling */}
      <style>{`
        .desktop-sidebar-only {
          display: block;
        }
        .mobile-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .desktop-sidebar-only {
            display: none !important;
          }
          .mobile-nav {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
