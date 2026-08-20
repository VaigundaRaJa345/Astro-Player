import React, { useEffect, useState } from 'react';
import { User, Clock, Trash2, Play, Music, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayback } from '../context/PlaybackContext';
import { api } from '../services/api';

export default function ProfileView() {
  const { user, stats, refreshProfile } = useAuth();
  const { playTrack, currentTrack } = usePlayback();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.getHistory();
        setHistory(res.history || []);
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [currentTrack]); // reload history if song changes

  const handleClearHistory = async () => {
    if (!confirm('Clear all your listening history?')) return;
    try {
      await api.clearHistory();
      setHistory([]);
      refreshProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="skeleton" style={{ width: '40%', height: '24px', marginBottom: '20px' }} />
        {[1, 2].map(n => (
          <div key={n} className="skeleton" style={{ width: '100%', height: '52px', borderRadius: '8px' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Profile Header Card */}
      <div className="glass-panel" style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
        position: 'relative'
      }}>
        {/* Avatar */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-secondary)',
          border: '2px solid var(--accent)',
          boxShadow: '0 0 15px var(--accent-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <User size={36} color="var(--accent)" />
        </div>

        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'white' }}>{user?.username || 'Astro Explorer'}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{user?.email}</p>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-block', marginTop: '6px' }}>
            Account Created: {new Date(user?.created_at || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Statistics Block */}
      <section>
        <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={16} color="var(--accent)" />
          Listening Stats
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Songs Played', val: stats.songsPlayed },
            { label: 'Minutes Listened', val: stats.minutesListened },
            { label: 'Playlists Created', val: stats.playlists },
            { label: 'Liked Tracks', val: stats.likedSongs },
            { label: 'Offline Tracks', val: stats.downloads }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{item.label}</span>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)', marginTop: '4px', textShadow: '0 0 10px var(--accent-glow)' }}>
                {item.val}
              </h2>
            </div>
          ))}
        </div>
      </section>

      {/* Listening History */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--text-muted)" />
            Listening History
          </h3>
          {history.length > 0 && (
            <button 
              onClick={handleClearHistory} 
              className="btn-icon" 
              style={{ color: 'var(--error)', width: '32px', height: '32px' }}
              title="Clear History"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {history.map((song, index) => {
            const isCurrent = currentTrack?.id === song.id;
            return (
              <div
                key={`${song.id}-history-${index}`}
                onClick={() => playTrack(song)}
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
                <img 
                  src={song.artwork_url} 
                  alt={song.title} 
                  style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', marginRight: '14px' }} 
                />
                
                <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: isCurrent ? 'var(--accent)' : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {song.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {song.artist}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {song.played_at ? formatDate(song.played_at) : ''}
                  </span>
                  <button 
                    onClick={() => playTrack(song)}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Play size={12} color="black" fill="black" style={{ marginLeft: '2px' }} />
                  </button>
                </div>
              </div>
            );
          })}

          {history.length === 0 && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--divider)',
              color: 'var(--text-muted)',
              fontSize: '13px'
            }}>
              Start listening to tracks to build your history!
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
