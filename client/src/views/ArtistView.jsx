import React, { useEffect, useState } from 'react';
import { Play, Shuffle, Heart, Plus, Check, ArrowLeft } from 'lucide-react';
import { usePlayback } from '../context/PlaybackContext';
import { api } from '../services/api';

export default function ArtistView({ artistName, artistImage, setView }) {
  const { playTrack, playCollection, currentTrack } = usePlayback();
  const [songs, setSongs] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dynamic seed tracks matching this artist name
  useEffect(() => {
    async function loadArtistSongs() {
      setLoading(true);
      try {
        const res = await api.getFeatured();
        const artistSongs = res.songs.filter(
          s => s.artist.toLowerCase().includes(artistName.toLowerCase())
        );
        setSongs(artistSongs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadArtistSongs();
  }, [artistName, currentTrack]);

  const handlePlayArtist = () => {
    if (songs.length === 0) return;
    playCollection(songs, 0);
  };

  const handleShuffleArtist = () => {
    if (songs.length === 0) return;
    playCollection(songs, 0);
    const mockClick = document.querySelector('.player-bar-container button[title="Shuffle"]');
    if (mockClick) mockClick.click();
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Back Button */}
      <button 
        onClick={() => setView('home')} 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          alignSelf: 'flex-start',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      {/* Artist Profile Header Banner */}
      <div 
        className="glass-panel"
        style={{
          position: 'relative',
          height: '220px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}
      >
        {/* Background photo with overlay gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${artistImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&h=400&q=80'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.65) saturate(1.2)'
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to top, var(--bg) 10%, rgba(5,5,5,0) 80%)',
          zIndex: 1
        }} />

        <div style={{ zIndex: 2 }}>
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.15em', color: 'var(--accent)', textTransform: 'uppercase' }}>
            Verified Artist
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'white', margin: '4px 0 10px 0', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
            {artistName}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            1.2M Monthly Listeners in Astro Universe
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button 
          onClick={handlePlayArtist}
          className="btn btn-primary"
          disabled={songs.length === 0}
        >
          <Play size={16} fill="white" />
          Play
        </button>

        <button 
          onClick={handleShuffleArtist}
          className="btn btn-secondary"
          disabled={songs.length === 0}
        >
          <Shuffle size={16} />
          Shuffle
        </button>

        <button 
          onClick={() => setIsFollowing(!isFollowing)}
          className="btn btn-secondary"
          style={{
            borderColor: isFollowing ? 'var(--accent)' : 'var(--divider)',
            color: isFollowing ? 'var(--accent)' : 'white'
          }}
        >
          {isFollowing ? <Check size={16} /> : <Plus size={16} />}
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Popular Tracks */}
      <div>
        <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '14px', fontWeight: '700' }}>Popular Songs</h3>
        
        {loading ? (
          <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: '8px' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {songs.map((song, index) => {
              const isCurrent = currentTrack?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => playTrack(song, index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    backgroundColor: isCurrent ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    border: isCurrent ? '1px solid var(--glass-border)' : '1px solid transparent',
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = isCurrent ? 'rgba(59, 130, 246, 0.08)' : 'transparent'}
                >
                  {/* index */}
                  <span style={{ width: '28px', fontSize: '13px', color: isCurrent ? 'var(--accent)' : 'var(--text-muted)', fontWeight: '700' }}>
                    {index + 1}
                  </span>

                  <img 
                    src={song.artwork_url} 
                    alt={song.title} 
                    style={{ width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover', marginRight: '12px' }} 
                  />

                  <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: isCurrent ? 'var(--accent)' : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {song.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                      {song.album || 'Cosmic Singles'}
                    </div>
                  </div>

                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {formatDuration(song.duration)}
                  </span>
                </div>
              );
            })}

            {songs.length === 0 && (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
                fontSize: '13px'
              }}>
                No verified tracks by this artist are seeded in local db.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
