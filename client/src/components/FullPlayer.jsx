import React, { useState, useEffect } from 'react';
import { ChevronDown, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Heart, Download, Share2, ListMusic, AlignLeft, Plus, Check } from 'lucide-react';
import { usePlayback } from '../context/PlaybackContext';
import { api } from '../services/api';

export default function FullPlayer({ isOpen, onClose, userPlaylists, refreshPlaylists }) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    shuffle,
    repeat,
    queue,
    likedSongIds,
    downloadedSongIds,
    togglePlay,
    playNext,
    playPrevious,
    playTrack,
    seek,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    downloadSong,
    removeFromQueue
  } = usePlayback();

  const [activePanel, setActivePanel] = useState('player'); // 'player' | 'lyrics' | 'queue'
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // Sync state closing/reset
  useEffect(() => {
    if (!isOpen) {
      setActivePanel('player');
    }
  }, [isOpen]);

  if (!currentTrack) return null;

  const isLiked = likedSongIds.has(currentTrack.id);
  const isDownloaded = downloadedSongIds.has(currentTrack.id);

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const remainingTime = duration - currentTime;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Mock Lyrics DB
  const getLyrics = (track) => {
    if (track.id.startsWith('astro_original_')) {
      return [
        { time: 0, text: "[Instrumental Intro]" },
        { time: 10, text: "Drifting away in the cosmic sea" },
        { time: 18, text: "Looking for stars where we used to be" },
        { time: 26, text: "The gravity pulls, but my spirit is free" },
        { time: 34, text: "Singing our song in the light of the galaxy" },
        { time: 42, text: "Nebula clouds swirling in our eyes" },
        { time: 50, text: "No more limits, no more disguise" },
        { time: 58, text: "Stellar drift takes us to the skies" },
        { time: 70, text: "[Chorus Instrumental]" },
        { time: 90, text: "Listen close to the pulsar heartbeat" },
        { time: 98, text: "In this universe we will surely meet" },
        { time: 106, text: "Starlight shining beneath our feet" },
        { time: 114, text: "Our sound is immortal, complete" }
      ];
    }
    return null;
  };

  const lyrics = getLyrics(currentTrack);

  // Share link copy helper
  const handleShare = () => {
    const url = `${window.location.origin}/song/${currentTrack.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    });
  };

  // Add to playlist helper
  const handleAddPlaylist = async (plId) => {
    try {
      await api.addSongToPlaylist(plId, currentTrack.id, currentTrack);
      setShowPlaylistModal(false);
      alert('Added to playlist successfully!');
      refreshPlaylists();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        transform: isOpen ? 'translateY(0%)' : 'translateY(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}
    >
      {/* Background Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '10%',
        width: '80%',
        height: '60%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(5,5,5,0) 70%)',
        zIndex: -1,
        pointerEvents: 'none'
      }} />

      {/* 1. Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        zIndex: 10
      }}>
        <button onClick={onClose} className="btn-icon" style={{ color: 'white' }}>
          <ChevronDown size={28} />
        </button>
        <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
          Now Playing
        </span>
        <button onClick={handleShare} className="btn-icon" style={{ color: 'white', position: 'relative' }}>
          <Share2 size={20} />
          {showShareTooltip && (
            <span style={{
              position: 'absolute',
              top: '44px',
              right: '0px',
              backgroundColor: 'var(--accent)',
              color: 'white',
              fontSize: '10px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
            }}>
              Link Copied!
            </span>
          )}
        </button>
      </div>

      {/* 2. Main Body Content Switcher */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* PANEL A: Core Player */}
        {activePanel === 'player' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 24px' }}>
            {/* Album Cover */}
            <div style={{
              position: 'relative',
              width: '80vw',
              maxWidth: '320px',
              aspectRatio: '1/1',
              marginBottom: '36px',
              transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: isPlaying ? 'scale(1.03)' : 'scale(0.96)'
            }}>
              <img 
                src={currentTrack.artwork_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&h=400&q=80'} 
                alt={currentTrack.title}
                className={isPlaying ? 'animate-spin-slow' : ''}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '24px',
                  objectFit: 'cover',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 40px var(--accent-glow)'
                }}
              />
            </div>

            {/* Song Meta (Title / Artist) */}
            <div style={{ width: '100%', maxWidth: '360px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div style={{ minWidth: 0, paddingRight: '16px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentTrack.title}
                </h2>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px' }}>
                  {currentTrack.artist}
                </p>
              </div>
              <button 
                onClick={() => toggleLike(currentTrack)} 
                className="btn-icon" 
                style={{ width: '48px', height: '48px', color: isLiked ? 'var(--accent)' : 'var(--text-secondary)' }}
              >
                <Heart size={26} fill={isLiked ? 'var(--accent)' : 'none'} />
              </button>
            </div>
          </div>
        )}

        {/* PANEL B: Lyrics Screen */}
        {activePanel === 'lyrics' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '24px', textAlign: 'center' }}>Lyrics</h3>
            {lyrics ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
                {lyrics.map((line, idx) => {
                  const isCurrent = currentTime >= line.time && (idx === lyrics.length - 1 || currentTime < lyrics[idx + 1].time);
                  return (
                    <div 
                      key={idx}
                      onClick={() => seek(line.time)}
                      style={{
                        fontSize: isCurrent ? '20px' : '16px',
                        fontWeight: isCurrent ? '800' : '500',
                        color: isCurrent ? 'var(--accent)' : 'var(--text-secondary)',
                        textShadow: isCurrent ? '0 0 10px var(--accent-glow)' : 'none',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      {line.text}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '14px' }}>
                Lyrics aren't available for this song.
              </div>
            )}
          </div>
        )}

        {/* PANEL C: Up Next Queue Screen */}
        {activePanel === 'queue' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '16px', textAlign: 'center' }}>Up Next</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '40px' }}>
              {queue.map((track, idx) => {
                const isCurrent = track.id === currentTrack.id;
                return (
                  <div 
                    key={`${track.id}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isCurrent ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      border: isCurrent ? '1px solid var(--glass-border)' : '1px solid transparent'
                    }}
                  >
                    <img 
                      src={track.artwork_url} 
                      alt={track.title}
                      style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div 
                        onClick={() => playTrack(track, idx)}
                        style={{ fontSize: '14px', fontWeight: '700', color: isCurrent ? 'var(--accent)' : 'white', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {track.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {track.artist}
                      </div>
                    </div>
                    {!isCurrent && (
                      <button 
                        onClick={() => removeFromQueue(track.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--error)', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
              {queue.length <= 1 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px' }}>
                  Queue is empty. Find more songs to add!
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 3. Slider & Controllers Bar (Static at Bottom) */}
      <div style={{
        padding: '0 24px 30px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(to top, var(--bg) 80%, rgba(5,5,5,0))',
        zIndex: 10
      }}>
        {/* Scrubber Bar */}
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '35px', textAlign: 'right' }}>
            {formatTime(currentTime)}
          </span>
          <input 
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(e.target.value)}
            style={{
              flex: 1,
              accentColor: 'var(--accent)',
              height: '6px',
              borderRadius: '3px',
              cursor: 'pointer',
              outline: 'none'
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '35px' }}>
            -{formatTime(remainingTime > 0 ? remainingTime : 0)}
          </span>
        </div>

        {/* Media Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <button 
            onClick={toggleShuffle} 
            className={`btn-icon ${shuffle ? 'active' : ''}`}
            style={{ width: '44px', height: '44px' }}
          >
            <Shuffle size={20} />
          </button>
          
          <button onClick={playPrevious} className="btn-icon" style={{ width: '44px', height: '44px', color: 'white' }}>
            <SkipBack size={24} fill="white" />
          </button>
          
          <button 
            onClick={togglePlay}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
            }}
          >
            {isPlaying ? <Pause size={28} color="black" fill="black" /> : <Play size={28} color="black" fill="black" style={{ marginLeft: '4px' }} />}
          </button>
          
          <button onClick={playNext} className="btn-icon" style={{ width: '44px', height: '44px', color: 'white' }}>
            <SkipForward size={24} fill="white" />
          </button>
          
          <button 
            onClick={toggleRepeat} 
            className={`btn-icon ${repeat !== 'none' ? 'active' : ''}`}
            style={{ width: '44px', height: '44px' }}
          >
            <Repeat size={20} />
            {repeat === 'one' && <span style={{ fontSize: '8px', position: 'absolute', bottom: '6px', fontWeight: '800' }}>1</span>}
          </button>
        </div>

        {/* Action Bar */}
        <div style={{ width: '100%', maxWidth: '360px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <button 
            onClick={() => setActivePanel(activePanel === 'lyrics' ? 'player' : 'lyrics')}
            className={`btn-icon ${activePanel === 'lyrics' ? 'active' : ''}`}
            title="Lyrics"
          >
            <AlignLeft size={20} />
          </button>
          
          <button 
            onClick={() => setShowPlaylistModal(true)} 
            className="btn-icon"
            title="Add to Playlist"
          >
            <Plus size={20} />
          </button>

          <button 
            onClick={() => downloadSong(currentTrack)} 
            className={`btn-icon ${isDownloaded ? 'active' : ''}`}
            style={{ color: isDownloaded ? 'var(--success)' : 'var(--text-secondary)' }}
            title="Download"
          >
            <Download size={20} />
          </button>

          <button 
            onClick={() => setActivePanel(activePanel === 'queue' ? 'player' : 'queue')}
            className={`btn-icon ${activePanel === 'queue' ? 'active' : ''}`}
            title="Queue"
          >
            <ListMusic size={20} />
          </button>
        </div>
      </div>

      {/* Custom Add-to-Playlist Modal */}
      {showPlaylistModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{
            width: '320px',
            padding: '24px',
            borderRadius: 'var(--radius-lg)'
          }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'white' }}>Add to Playlist</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
              {userPlaylists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => handleAddPlaylist(pl.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    color: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                >
                  <span>{pl.name}</span>
                  <Plus size={14} color="var(--text-secondary)" />
                </button>
              ))}
              {userPlaylists.length === 0 && (
                <div style={{ fontStyle: 'italic', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No custom playlists. Create one in the sidebar first.
                </div>
              )}
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%' }}
              onClick={() => setShowPlaylistModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
