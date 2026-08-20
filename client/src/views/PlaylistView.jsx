import React, { useEffect, useState } from 'react';
import { Play, Shuffle, Trash2, X, Music, Download, Share2, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { usePlayback } from '../context/PlaybackContext';

export default function PlaylistView({ playlistId, setView, setViewParams, refreshPlaylists }) {
  const { playTrack, playCollection, currentTrack, isPlaying } = usePlayback();
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlaylist() {
      setLoading(true);
      try {
        const res = await api.getPlaylist(playlistId);
        setPlaylist(res.playlist);
        setSongs(res.songs || []);
      } catch (err) {
        console.error('Failed to load playlist details', err);
      } finally {
        setLoading(false);
      }
    }
    loadPlaylist();
  }, [playlistId, currentTrack]); // refresh list if track details change

  const handlePlayPlaylist = () => {
    if (songs.length === 0) return;
    playCollection(songs, 0);
  };

  const handleShufflePlaylist = () => {
    if (songs.length === 0) return;
    // Play with shuffle enabled
    playCollection(songs, 0);
    // Trigger shuffle toggle
    const mockClick = document.querySelector('.player-bar-container button[title="Shuffle"]');
    if (mockClick) mockClick.click();
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await api.deletePlaylist(playlistId);
      refreshPlaylists();
      setView('library');
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeepPlaylistCached = async () => {
    if (songs.length === 0) {
      alert('Cannot cache an empty playlist.');
      return;
    }
    if (!confirm(`Keep this playlist cached for 7 days?\n\n${songs.length} songs. Playlist metadata + song metadata will be cached to reduce YouTube API requests.`)) return;

    try {
      await api.keepCached(playlist.id, 'playlist', {
        id: playlist.id,
        title: playlist.name,
        artwork: playlist.artwork,
        description: playlist.description,
        songs
      });

      // Loop and cache all songs within this playlist
      const promises = songs.map(song => api.keepCached(song.id, 'song', song));
      await Promise.all(promises);

      alert(`✓ Playlist "${playlist.name}" cached for 7 days.`);
    } catch (err) {
      console.error(err);
      alert('Failed to cache playlist metadata.');
    }
  };

  const handleRemoveSong = async (e, songId) => {
    e.stopPropagation();
    try {
      await api.removeSongFromPlaylist(playlistId, songId);
      // update local state
      setSongs(prev => prev.filter(s => s.id !== songId));
      refreshPlaylists();
    } catch (err) {
      console.error(err);
    }
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
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Playlist not found.
        <button onClick={() => setView('library')} className="btn btn-secondary" style={{ marginTop: '20px', margin: '0 auto' }}>
          Go to Library
        </button>
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

      {/* Playlist Hero Block */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <img 
          src={playlist.artwork} 
          alt={playlist.name} 
          style={{
            width: '140px',
            height: '140px',
            borderRadius: '16px',
            objectFit: 'cover',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid var(--glass-border)'
          }}
        />
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
            User Playlist
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'white', margin: '4px 0 8px 0' }}>
            {playlist.name}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {playlist.description || 'No description provided.'}
          </p>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {songs.length} songs • Created in Astro Music Space
          </span>
        </div>
      </div>

      {/* Playlist Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button 
          onClick={handlePlayPlaylist}
          className="btn btn-primary"
          disabled={songs.length === 0}
        >
          <Play size={16} fill="white" />
          Play
        </button>

        <button 
          onClick={handleShufflePlaylist}
          className="btn btn-secondary"
          disabled={songs.length === 0}
        >
          <Shuffle size={16} />
          Shuffle
        </button>

        <button 
          onClick={handleDeletePlaylist}
          className="btn btn-secondary"
          style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}
        >
          <Trash2 size={16} />
          Delete
        </button>

        <button 
          onClick={handleKeepPlaylistCached}
          className="btn btn-secondary"
          style={{ color: 'var(--accent)', borderColor: 'rgba(59,130,246,0.2)' }}
        >
          <Music size={16} />
          Keep Cached for 7 Days
        </button>
      </div>

      {/* Track List */}
      <div>
        <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '14px', fontWeight: '700' }}>Tracks</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {songs.map((song, index) => {
            const isCurrent = currentTrack?.id === song.id;
            return (
              <div
                key={`${song.id}-playlist-track-${index}`}
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
                {/* Track Index */}
                <span style={{ width: '28px', fontSize: '13px', color: isCurrent ? 'var(--accent)' : 'var(--text-muted)', fontWeight: '700' }}>
                  {index + 1}
                </span>

                {/* Cover & details */}
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

                {/* Remove button */}
                <button
                  onClick={(e) => handleRemoveSong(e, song.id)}
                  className="btn-icon"
                  style={{ width: '32px', height: '32px', color: 'var(--text-muted)' }}
                  title="Remove from Playlist"
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}

          {songs.length === 0 && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--divider)',
              color: 'var(--text-muted)',
              fontSize: '13px'
            }}>
              No songs in this playlist. Start searching and add them!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
