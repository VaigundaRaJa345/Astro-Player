import React, { useEffect, useState } from 'react';
import { Download, Trash2, Play, AlertCircle, Wifi, HardDrive } from 'lucide-react';
import { api } from '../services/api';
import { usePlayback } from '../context/PlaybackContext';
import { useAuth } from '../context/AuthContext';

export default function DownloadsView() {
  const { playTrack, removeDownload, clearAllDownloads, currentTrack } = usePlayback();
  const { settings, updateSettings } = useAuth();
  
  const [downloadedSongs, setDownloadedSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDownloads() {
      setLoading(true);
      try {
        const res = await api.getDownloads();
        setDownloadedSongs(res.songs || []);
      } catch (err) {
        console.error('Failed to load downloads list', err);
      } finally {
        setLoading(false);
      }
    }
    loadDownloads();
  }, [currentTrack]); // refresh if track removes

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all offline downloads? This will delete all cached audio files.')) return;
    await clearAllDownloads();
    setDownloadedSongs([]);
  };

  const handleRemove = async (e, songId) => {
    e.stopPropagation();
    if (!confirm('Delete this download from your device?')) return;
    await removeDownload(songId);
    setDownloadedSongs(prev => prev.filter(s => s.id !== songId));
  };

  const handleWifiToggle = async () => {
    await updateSettings({ wifi_only: settings.wifi_only === 1 ? 0 : 1 });
  };

  const handleQualityChange = async (e) => {
    await updateSettings({ download_quality: e.target.value });
  };

  // Calculate approximate storage space used (3MB per song average fallback)
  const totalStorageMB = (downloadedSongs.length * 3.4).toFixed(1);

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="skeleton" style={{ width: '50%', height: '24px', marginBottom: '20px' }} />
        {[1, 2, 3].map(n => (
          <div key={n} className="skeleton" style={{ width: '100%', height: '56px', borderRadius: '8px' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Download size={24} color="var(--accent)" />
          Offline Downloads
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Play your music without internet connection
        </p>
      </div>

      {/* Storage and Toggle Settings Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Storage card */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59,130,246,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)'
          }}>
            <HardDrive size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Device Storage</span>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginTop: '2px' }}>
              {totalStorageMB} MB Used
            </h3>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--divider)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
              {/* Fake progress bar depicting 48GB total space */}
              <div style={{ width: `${Math.min((parseFloat(totalStorageMB) / 500) * 100, 100)}%`, height: '100%', backgroundColor: 'var(--accent)' }} />
            </div>
          </div>
          {downloadedSongs.length > 0 && (
            <button 
              onClick={handleClearAll} 
              className="btn-icon" 
              style={{ color: 'var(--error)' }}
              title="Clear all downloads"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* Configurations Settings card */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wifi size={16} color="var(--text-secondary)" />
              Download over Wi-Fi only
            </span>
            <input 
              type="checkbox" 
              checked={settings.wifi_only === 1}
              onChange={handleWifiToggle}
              style={{
                width: '38px',
                height: '20px',
                accentColor: 'var(--accent)',
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--divider)', paddingTop: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>Download Quality</span>
            <select 
              value={settings.download_quality || 'High'} 
              onChange={handleQualityChange}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--divider)',
                color: 'white',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Standard">Standard (128kbps)</option>
              <option value="High">High (256kbps)</option>
              <option value="Very High">Ultra High (320kbps)</option>
            </select>
          </div>
        </div>

      </div>

      {/* Downloaded Songs list */}
      <div>
        <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '14px', fontWeight: '700' }}>Downloaded Songs</h3>
        
        {/* Offline indicator banner */}
        {!navigator.onLine && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(245,175,25,0.1)',
            border: '1px solid rgba(245,175,25,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            color: '#F5AF19',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            <AlertCircle size={18} />
            You're currently offline. Only downloaded files are playable.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {downloadedSongs.map((song, index) => {
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleRemove(e, song.id)}
                    className="btn-icon"
                    style={{ width: '36px', height: '36px', color: 'var(--text-muted)' }}
                    title="Delete download"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    onClick={() => playTrack(song, index)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Play size={14} color="black" fill="black" style={{ marginLeft: '2px' }} />
                  </button>
                </div>
              </div>
            );
          })}

          {downloadedSongs.length === 0 && (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--divider)',
              color: 'var(--text-muted)',
              fontSize: '13px'
            }}>
              Your offline music will appear here. Find eligible tracks and click download!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
