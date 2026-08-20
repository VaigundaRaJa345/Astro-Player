import React, { useState } from 'react';
import { Heart, Disc, Download, Plus, Library, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function LibraryView({ setView, setViewParams, userPlaylists, refreshPlaylists }) {
  const { stats } = useAuth();
  const [filter, setFilter] = useState('all'); // 'all' | 'playlists' | 'downloads'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlName, setNewPlName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPlName.trim()) return;
    try {
      await api.createPlaylist(newPlName, 'My custom Astro playlist');
      setNewPlName('');
      setShowCreateModal(false);
      refreshPlaylists();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Library size={24} color="var(--accent)" />
          Your Library
        </h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-secondary" 
          style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          Create Playlist
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['all', 'playlists', 'downloads'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filter === t ? '1px solid var(--accent)' : '1px solid var(--divider)',
              backgroundColor: filter === t ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
              color: filter === t ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'var(--transition)'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Core Library Entry Blocks */}
      {filter === 'all' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
          {/* Liked Songs card */}
          <div 
            onClick={() => setView('liked')}
            style={{
              height: '160px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--deep-blue) 0%, var(--primary) 50%, var(--accent) 100%)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(37,99,235,0.25), 0 0 15px var(--accent-glow)',
              transition: 'var(--transition)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Heart size={20} fill="white" color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>Liked Songs</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                {stats.likedSongs} songs
              </p>
            </div>
          </div>

          {/* Downloads Card */}
          <div 
            onClick={() => setView('downloads')}
            style={{
              height: '160px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #111318 0%, #171A21 100%)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              border: '1px solid var(--divider)',
              transition: 'var(--transition)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(59,130,246,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Download size={20} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>Downloads</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {stats.downloads} songs offline
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Grid */}
      {(filter === 'all' || filter === 'playlists') && (
        <section>
          <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Playlists
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {userPlaylists.map(pl => (
              <div 
                key={pl.id}
                className="glass-panel"
                onClick={() => { setView('playlist'); setViewParams({ id: pl.id }); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.03)',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <img 
                  src={pl.artwork} 
                  alt={pl.name} 
                  style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', marginRight: '14px' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pl.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {pl.song_count || 0} songs • By you
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            ))}

            {userPlaylists.length === 0 && filter === 'playlists' && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontSize: '14px' }}>
                No playlists created yet.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Downloads Redirect Notice (if filter is selected) */}
      {filter === 'downloads' && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px' }}>
          <Download size={32} color="var(--accent)" style={{ marginBottom: '16px' }} />
          <p style={{ fontSize: '14px', marginBottom: '20px' }}>Manage all downloaded offline music tracks in the Downloads Control panel.</p>
          <button onClick={() => setView('downloads')} className="btn btn-primary" style={{ margin: '0 auto' }}>
            Open Downloads Panel
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
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
            width: '340px',
            padding: '24px',
            borderRadius: 'var(--radius-lg)'
          }}>
            <h3 style={{ fontSize: '17px', marginBottom: '16px', color: 'white' }}>Create New Playlist</h3>
            <form onSubmit={handleCreate}>
              <input
                type="text"
                placeholder="Playlist name"
                className="input-field"
                value={newPlName}
                onChange={e => setNewPlName(e.target.value)}
                autoFocus
                style={{ marginBottom: '20px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { setShowCreateModal(false); setNewPlName(''); }}
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

    </div>
  );
}
