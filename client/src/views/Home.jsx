import React, { useEffect, useState } from 'react';
import { Play, Pause, MoreVertical, Heart, Download, Share2, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayback } from '../context/PlaybackContext';
import { api } from '../services/api';
import { getTranslation } from '../services/translations';

export default function Home({ setView, setViewParams, userPlaylists, refreshPlaylists }) {
  const { user, language } = useAuth();
  const { 
    currentTrack, 
    isPlaying, 
    likedSongIds, 
    downloadedSongIds,
    playTrack, 
    playCollection, 
    addToQueue, 
    toggleLike, 
    downloadSong 
  } = usePlayback();

  const t = (key) => getTranslation(language, key);

  const [featuredSongs, setFeaturedSongs] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Tamil categories states
  const [trendingTamil, setTrendingTamil] = useState([]);
  const [tamilMelody, setTamilMelody] = useState([]);
  const [tamilMass, setTamilMass] = useState([]);
  const [tamilClassics, setTamilClassics] = useState([]);
  
  const [activeMenuSong, setActiveMenuSong] = useState(null);
  const [showAddToPlaylistDropdown, setShowAddToPlaylistDropdown] = useState(false);
  const [greeting, setGreeting] = useState('goodMorning');

  // Compute greeting dynamically based on local hours
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('goodMorning');
    else if (hours < 18) setGreeting('goodAfternoon');
    else setGreeting('goodEvening');
  }, []);

  // Fetch data
  useEffect(() => {
    async function loadData() {
      try {
        const featuredRes = await api.getFeatured();
        setFeaturedSongs(featuredRes.songs || []);
        
        const historyRes = await api.getHistory();
        setHistory(historyRes.history || []);

        // Load Tamil sections asynchronously
        api.searchSongs('Trending Tamil Songs').then(res => setTrendingTamil(res.songs?.slice(0, 8) || []));
        api.searchSongs('Tamil Melody Hit Songs').then(res => setTamilMelody(res.songs?.slice(0, 8) || []));
        api.searchSongs('Tamil Mass BGM songs').then(res => setTamilMass(res.songs?.slice(0, 8) || []));
        api.searchSongs('Classic Tamil Hit Songs').then(res => setTamilClassics(res.songs?.slice(0, 8) || []));

      } catch (err) {
        console.error('Failed to load home dashboard data', err);
      }
    }
    loadData();
  }, [currentTrack]);

  // Seed popular Tamil music composers
  const artists = [
    { name: 'A.R. Rahman', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&h=300&q=80', description: 'Isai Puyal / Mozart of Madras' },
    { name: 'Anirudh Ravichander', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=300&h=300&q=80', description: 'Rockstar of Kollywood' },
    { name: 'Ilaiyaraaja', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=300&h=300&q=80', description: 'Isaignani / Maestro' },
    { name: 'Yuvan Shankar Raja', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&h=300&q=80', description: 'U1 / BGM King' }
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

  const handleKeepCached = async (song) => {
    setActiveMenuSong(null);
    if (!confirm('Keep this song cached for 7 days? We\'ll keep the song\'s available metadata and discovery information cached to reduce API requests.')) return;
    try {
      await api.keepCached(song.id, 'song', song);
      alert('✓ Cached for 7 days');
    } catch (err) {
      alert('Failed to cache song metadata.');
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveMenuSong(null);
      setShowAddToPlaylistDropdown(false);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const renderHorizontalSection = (title, songsList) => {
    if (songsList.length === 0) return null;
    return (
      <section>
        <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '14px', fontWeight: '700' }}>{title}</h3>
        <div className="scroll-x">
          {songsList.map((song, idx) => (
            <div 
              key={`${song.id}-horiz-${idx}`}
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
    );
  };

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '80px' }}>
      
      {/* 1. Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white' }}>
          {t(greeting)}, {user?.username || 'Astro'}
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

      {/* 2. Hero Banner */}
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
            {t('featuredTitle')}
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: '6px 0 10px 0', lineHeight: '1.2' }}>
            {t('universeTitle')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
            {t('universeSubtitle')}
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => {
                if (featuredSongs.length > 0) playCollection(featuredSongs, 0);
              }}
              className="btn btn-primary" 
              style={{ padding: '10px 20px', fontSize: '13px', borderRadius: 'var(--radius-md)' }}
            >
              <Play size={14} fill="white" style={{ marginRight: '2px' }} />
              {t('playUniverse')}
            </button>
            <button 
              onClick={() => setView('discover')}
              className="btn btn-secondary" 
              style={{ padding: '10px 20px', fontSize: '13px', borderRadius: 'var(--radius-md)' }}
            >
              {t('exploreGenres')}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Tamil Sections */}
      {renderHorizontalSection(t('trendingTamil'), trendingTamil)}
      {renderHorizontalSection(t('tamilMelody'), tamilMelody)}
      {renderHorizontalSection(t('tamilMass'), tamilMass)}
      {renderHorizontalSection(t('tamilClassics'), tamilClassics)}

      {/* Recently Played */}
      {history.length > 0 && (
        <section>
          <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '14px', fontWeight: '700' }}>{t('recentlyPlayed')}</h3>
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

      {/* Astro Originals Quick Picks */}
      <section>
        <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '14px', fontWeight: '700' }}>{t('quickPicks')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {featuredSongs.map((song) => {
            const isLiked = likedSongIds.has(song.id);
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
                    <button onClick={() => { playTrack(song); setActiveMenuSong(null); }} style={menuItemStyle}>{t('play')}</button>
                    <button onClick={handleMenuPlayNext} style={menuItemStyle}>{t('addQueue')}</button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowAddToPlaylistDropdown(!showAddToPlaylistDropdown); }} 
                      style={{ ...menuItemStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      {t('addToPlaylist')} {showAddToPlaylistDropdown ? '▼' : '►'}
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
                    <button onClick={() => { downloadSong(song); setActiveMenuSong(null); }} style={menuItemStyle}>{t('download')}</button>
                    <button onClick={() => handleKeepCached(song)} style={{ ...menuItemStyle, color: 'var(--accent)' }}>Keep Cached for 7 Days</button>
                    <button onClick={handleMenuShare} style={menuItemStyle}>{t('shareLink')}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recommended Artists */}
      <section>
        <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '14px', fontWeight: '700' }}>{t('recommendedArtists')}</h3>
        <div className="scroll-x">
          {artists.map((artist, idx) => (
            <div 
              key={idx} 
              className="card"
              onClick={() => { setView('search'); setViewParams({ initialQuery: artist.name }); }}
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
