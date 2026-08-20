import React, { useEffect, useState } from 'react';
import { Play, Shuffle, Heart, Download, Trash2, ArrowLeft, Disc } from 'lucide-react';
import { api } from '../services/api';
import { usePlayback } from '../context/PlaybackContext';

export default function LikedSongs({ setView, setViewParams }) {
  const { playTrack, playCollection, currentTrack, likedSongIds, toggleLike } = usePlayback();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLikedSongs() {
      setLoading(true);
      try {
        const res = await api.getLikedSongs();
        setSongs(res.songs || []);
      } catch (err) {
        console.error('Failed to load liked songs', err);
      } finally {
        setLoading(false);
      }
    }
    loadLikedSongs();
  }, [likedSongIds, currentTrack]); // refresh if liked list size adjusts or track switches

  const handlePlayLiked = () => {
    if (songs.length === 0) return;
    playCollection(songs, 0);
  };

  const handleShuffleLiked = () => {
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

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="skeleton" style={{ width: '120px', height: '120px', borderRadius: '12px' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
            <div className="skeleton" style={{ width: '60%', height: '24px' }} />
            <div className="skeleton" style={{ width: '40%', height: '14px' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '30px' }}>
          {[1, 2].map(n => (
            <div key={n} className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Back Button */}
      <button 
        onClick={() => setView('library')} 
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
        Back to Library
      </button>

      {/* Liked Hero Header */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{
          width: '140px',
          height: '140px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--deep-blue) 0%, var(--primary) 50%, var(--accent) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(37,99,235,0.3)',
          border: '1px solid var(--glass-border)'
        }}>
          <Heart size={56} color="white" fill="white" />
        </div>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
            Collection
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: '4px 0 8px 0' }}>
            Liked Songs
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Your curated selection of favorited cosmic soundscapes.
          </p>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {songs.length} songs
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button 
          onClick={handlePlayLiked}
          className="btn btn-primary"
          disabled={songs.length === 0}
        >
          <Play size={16} fill="white" />
          Play All
        </button>

        <button 
          onClick={handleShuffleLiked}
          className="btn btn-secondary"
          disabled={songs.length === 0}
        >
          <Shuffle size={16} />
          Shuffle
        </button>
      </div>

      {/* Songs List */}
      <div>
        <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '14px', fontWeight: '700' }}>Song List</h3>
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
                {/* Index */}
                <span style={{ width: '28px', fontSize: '13px', color: isCurrent ? 'var(--accent)' : 'var(--text-muted)', fontWeight: '700' }}>
                  {index + 1}
                </span>

                {/* Details */}
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
                    {song.artist}
                  </div>
                </div>

                {/* Duration */}
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginRight: '16px' }}>
                  {formatDuration(song.duration)}
                </span>

                {/* Remove heart */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                  className="btn-icon"
                  style={{ width: '32px', height: '32px', color: 'var(--accent)' }}
                  title="Remove from Liked"
                >
                  <Heart size={16} fill="var(--accent)" />
                </button>
              </div>
            );
          })}

          {songs.length === 0 && (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--divider)',
              color: 'var(--text-muted)',
              fontSize: '13px'
            }}>
              Songs you love will appear here. Click the heart icon on any song card!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
