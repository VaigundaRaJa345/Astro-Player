import React, { useEffect, useState } from 'react';
import { Play, Pause, MoreVertical, Heart, Download, Share2, Plus, Disc, User, Search, AlignLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayback } from '../context/PlaybackContext';
import { api } from '../services/api';

export default function Home({ setView, setViewParams, userPlaylists, refreshPlaylists }) {
  const { user } = useAuth();
  const { 
    currentTrack, 
    isPlaying, 
    likedSongIds, 
    downloadedSongIds,
    playTrack, 
    togglePlay, 
    playCollection, 
    addToQueue, 
    toggleLike, 
    downloadSong 
  } = usePlayback();

  const [featuredSongs, setFeaturedSongs] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeMenuSong, setActiveMenuSong] = useState(null);
  const [showAddToPlaylistDropdown, setShowAddToPlaylistDropdown] = useState(false);
  const [greeting, setGreeting] = useState('Good morning');

  // Compute greeting dynamically based on local hours
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good morning');
    else if (hours < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Fetch data
  useEffect(() => {
    async function loadData() {
      try {
        const featuredRes = await api.getFeatured();
        setFeaturedSongs(featuredRes.songs || []);
        
        const historyRes = await api.getHistory();
        setHistory(historyRes.history || []);
      } catch (err) {
        console.error('Failed to load home dashboard data', err);
      }
    }
    loadData();
  }, [currentTrack]); // refresh if track changes

  // Seed default fallback artists
  const artists = [
    { name: 'Astro Project', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80', description: 'Electronic / Ambient Space Beats' },
    { name: 'Cosmo Beats', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300&q=80', description: 'Lo-Fi Nebula soundscapes' },
    { name: 'Lofi Orbit', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300&q=80', description: 'Relaxing galactic frequencies' },
    { name: 'Interstellar Ensemble', image: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&h=300&q=80', description: 'Symphonic orchestra and synthwave' }
  ];

  // Song Options Menu Actions
  const toggleTrackMenu = (e, song) => {
    e.stopPropagation();
    if (activeMenuSong && activeMenuSong.id === song.id) {
      setActiveMenuSong(null);
    } else {
      setActiveMenuSong(song);
    }
    setShowAddToPlaylistDropdown(false);
  };

  const handleMenuPlayNext = (e) => {
    e.stopPropagation();
    // Insert song in queue after active index
    addToQueue(activeMenuSong);
    setActiveMenuSong(null);
    alert(`"${activeMenuSong.title}" added to queue.`);
  };

  const handleMenuAddToPlaylist = async (e, plId) => {
    e.stopPropagation();
    try {
      await api.addSongToPlaylist(plId, activeMenuSong.id, activeMenuSong);
      setActiveMenuSong(null);
      setShowAddToPlaylistDropdown(false);
      alert('Added to playlist successfully!');
      refreshPlaylists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMenuShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/song/${activeMenuSong.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Share link copied to clipboard!');
      setActiveMenuSong(null);
    });
  };

  // Close menus
  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveMenuSong(null);
      setShowAddToPlaylistDropdown(false);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', tracking: '-0.02em', color: 'white' }}>
          {greeting}, {user?.username || 'Astro'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setView('search')} className="btn-icon">
            <Search size={20} />
          </button>
          <button onClick={() => setView('profile')} style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--divider)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden'
          }}>
            <User size={18} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* 2. Hero Section */}
      <div 
        className="glass-panel" 
        style={{
          borderRadius: 'var(--radius-lg)',
          padding: '30px 24px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          minHeight: '200px',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4), 0 0 20px var(--accent-glow)'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'linear-gradient(to right, rgba(5,5,5,0.95) 40%, rgba(37,99,235,0.15) 100%)',
          zIndex: 1
        }} />
        <div style={{ zIndex: 2, maxWidth: '280px' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.15em', color: 'var(--accent)', textTransform: 'uppercase' }}>
            Featured Astro Release
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: '6px 0 10px 0', lineHeight: '1.2' }}>
            Your Music Universe
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
            Discover something new in the galaxy of soundscapes. Start exploration now.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => {
                if (featuredSongs.length > 0) playCollection(featuredSongs, 0);
              }}
              className="btn btn-primary" 
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              <Play size={14} fill="white" style={{ marginRight: '2px' }} />
              Play Universe
            </button>
            <button 
              onClick={() => setView('discover')}
              className="btn btn-secondary" 
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              Explore Genres
            </button>
          </div>
        </div>
      </div>

      {/* Recently Played */}
      {history.length > 0 && (
        <section>
          <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '14px', fontWeight: '700' }}>Recently Played</h3>
          <div className="scroll-x">
            {history.slice(0, 8).map((song, idx) => (
              <div 
                key={`${song.id}-recent-${idx}`}
                className="card"
                onClick={() => playTrack(song)}
                style={{ width: '130px', flexShrink: 0, padding: '12px' }}
              >
                <div style={{ position: 'relative', width: '106px', height: '106px', marginBottom: '8px' }}>
                  <img src={song.artwork_url} alt={song.title} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                  <div className="hover-play-overlay">
                    <Play size={18} fill="white" color="white" />
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {song.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {song.artist}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Picks (Featured Originals) */}
      <section>
        <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '14px', fontWeight: '700' }}>Quick Picks</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {featuredSongs.map((song) => {
            const isLiked = likedSongIds.has(song.id);
            const isDownloaded = downloadedSongIds.has(song.id);
            return (
              <div 
                key={song.id} 
                className="glass-panel"
                onClick={() => playTrack(song)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.03)',
                  transition: 'var(--transition)',
                  position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <img 
                  src={song.artwork_url} 
                  alt={song.title} 
                  style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', marginRight: '12px' }} 
                />
                
                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {song.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {song.artist}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => toggleLike(song)} className="btn-icon" style={{ width: '32px', height: '32px', color: isLiked ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <Heart size={14} fill={isLiked ? 'var(--accent)' : 'none'} />
                  </button>
                  <button onClick={(e) => toggleTrackMenu(e, song)} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                    <MoreVertical size={16} />
                  </button>
                </div>

                {/* Track Option Menu Popup */}
                {activeMenuSong && activeMenuSong.id === song.id && (
                  <div 
                    onClick={e => e.stopPropagation()}
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '46px',
                      width: '180px',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      zIndex: 80,
                      padding: '6px'
                    }}
                  >
                    <button onClick={() => { playTrack(song); setActiveMenuSong(null); }} style={menuItemStyle}>Play</button>
                    <button onClick={handleMenuPlayNext} style={menuItemStyle}>Add to queue</button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowAddToPlaylistDropdown(!showAddToPlaylistDropdown); }} 
                      style={{ ...menuItemStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      Add to playlist {showAddToPlaylistDropdown ? '▼' : '►'}
                    </button>
                    {showAddToPlaylistDropdown && (
                      <div style={{ paddingLeft: '8px', maxHeight: '100px', overflowY: 'auto', borderLeft: '2px solid var(--divider)', margin: '4px 0' }}>
                        {userPlaylists.map(pl => (
                          <button key={pl.id} onClick={(e) => handleMenuAddToPlaylist(e, pl.id)} style={{ ...menuItemStyle, fontSize: '11px', padding: '6px 8px' }}>
                            {pl.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={() => { downloadSong(song); setActiveMenuSong(null); }} style={menuItemStyle}>Download</button>
                    <button onClick={handleMenuShare} style={menuItemStyle}>Share link</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recommended Artists */}
      <section>
        <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '14px', fontWeight: '700' }}>Recommended Artists</h3>
        <div className="scroll-x">
          {artists.map((artist, idx) => (
            <div 
              key={idx} 
              className="card"
              onClick={() => { setView('artist'); setViewParams({ name: artist.name, image: artist.image }); }}
              style={{ width: '130px', flexShrink: 0, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <img 
                src={artist.image} 
                alt={artist.name} 
                style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.06)' }} 
              />
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', width: '100%' }}>
                {artist.name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {artist.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Playlists */}
      {userPlaylists.length > 0 && (
        <section>
          <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '14px', fontWeight: '700' }}>Your Playlists</h3>
          <div className="scroll-x">
            {userPlaylists.map(pl => (
              <div 
                key={pl.id}
                className="card"
                onClick={() => { setView('playlist'); setViewParams({ id: pl.id }); }}
                style={{ width: '130px', flexShrink: 0, padding: '12px' }}
              >
                <div style={{ position: 'relative', width: '106px', height: '106px', marginBottom: '8px' }}>
                  <img src={pl.artwork} alt={pl.name} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                  <div className="hover-play-overlay">
                    <Play size={18} fill="white" color="white" />
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pl.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {pl.song_count || 0} songs
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CSS overlay utilities */}
      <style>{`
        .hover-play-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          border-radius: var(--radius-sm);
          transition: opacity 0.2s ease;
        }
        .card:hover .hover-play-overlay {
          opacity: 1;
        }
      `}</style>

    </div>
  );
}

const menuItemStyle = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: '12px',
  fontWeight: '600',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: '4px',
  transition: 'background 0.2s ease'
};
