import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, VolumeX, ListMusic, AlignLeft, Heart, Download } from 'lucide-react';
import { usePlayback } from '../context/PlaybackContext';

export default function MiniPlayer({ onExpand, onToggleQueue, onToggleLyrics }) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    likedSongIds,
    downloadedSongIds,
    downloadProgress,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    changeVolume,
    toggleMute,
    toggleLike,
    downloadSong,
    removeDownload
  } = usePlayback();

  if (!currentTrack) return null;

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isLiked = likedSongIds.has(currentTrack.id);
  const isDownloaded = downloadedSongIds.has(currentTrack.id);
  const activeDownload = downloadProgress[currentTrack.id];

  const handlePlayClick = (e) => {
    e.stopPropagation();
    togglePlay();
  };

  const handleNextClick = (e) => {
    e.stopPropagation();
    playNext();
  };

  const handlePrevClick = (e) => {
    e.stopPropagation();
    playPrevious();
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    toggleLike(currentTrack);
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    if (isDownloaded) {
      if (confirm(`Remove download for "${currentTrack.title}"?`)) {
        removeDownload(currentTrack.id);
      }
    } else {
      downloadSong(currentTrack);
    }
  };

  return (
    <div 
      onClick={onExpand}
      className="glass-panel player-bar-container"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        backgroundColor: 'rgba(11, 11, 15, 0.9)',
        borderTop: '1px solid var(--divider)',
        boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.6), 0 0 15px var(--accent-glow)',
        backdropFilter: 'blur(24px)',
        zIndex: 90,
        cursor: 'pointer',
        transition: 'var(--transition)'
      }}
    >
      {/* 1. Mobile Layout View */}
      <div className="mobile-player-only" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        height: '60px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <img 
            src={currentTrack.artwork_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=100&h=100&q=80'} 
            alt={currentTrack.title}
            className={isPlaying ? 'animate-spin-slow' : ''}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1px solid var(--glass-border)'
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTrack.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTrack.artist}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', onClick: (e) => e.stopPropagation() }}>
          <button 
            onClick={handleLikeClick} 
            className="btn-icon" 
            style={{ width: '36px', height: '36px', color: isLiked ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <Heart size={18} fill={isLiked ? 'var(--accent)' : 'none'} />
          </button>
          
          <button 
            onClick={handlePlayClick} 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={16} color="black" fill="black" /> : <Play size={16} color="black" fill="black" style={{ marginLeft: '2px' }} />}
          </button>
          
          <button 
            onClick={handleNextClick} 
            className="btn-icon" 
            style={{ width: '36px', height: '36px', color: 'white' }}
          >
            <SkipForward size={18} fill="white" />
          </button>
        </div>

        {/* Slim progress bar along bottom of mobile player */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          backgroundColor: 'rgba(255,255,255,0.1)'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: 'var(--accent)',
            width: `${progressPercent}%`,
            boxShadow: '0 0 4px var(--accent)'
          }} />
        </div>
      </div>

      {/* 2. Desktop Layout View */}
      <div className="desktop-player-only" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        height: '90px'
      }}>
        {/* Track Metadata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '30%', minWidth: '220px' }}>
          <img 
            src={currentTrack.artwork_url} 
            alt={currentTrack.title}
            className={isPlaying ? 'animate-spin-slow' : ''}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              objectFit: 'cover',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTrack.title}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
              {currentTrack.artist}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button onClick={handleLikeClick} className="btn-icon" style={{ color: isLiked ? 'var(--accent)' : 'var(--text-secondary)' }}>
              <Heart size={16} fill={isLiked ? 'var(--accent)' : 'none'} />
            </button>
            
            <button 
              onClick={handleDownloadClick} 
              className="btn-icon" 
              style={{ color: isDownloaded ? 'var(--success)' : 'var(--text-secondary)' }}
              disabled={activeDownload !== undefined && activeDownload > 0 && activeDownload < 100}
            >
              {activeDownload !== undefined && activeDownload > 0 && activeDownload < 100 ? (
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--accent)' }}>{activeDownload}%</div>
              ) : (
                <Download size={16} color={isDownloaded ? 'var(--success)' : 'var(--text-secondary)'} />
              )}
            </button>
          </div>
        </div>

        {/* Central Controls & Seek Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '600px', padding: '0 20px' }}>
          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '8px' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
              className={`btn-icon ${shuffle ? 'active' : ''}`}
              style={{ width: '32px', height: '32px' }}
            >
              <Shuffle size={15} />
            </button>
            
            <button 
              onClick={handlePrevClick}
              className="btn-icon"
              style={{ width: '32px', height: '32px', color: 'white' }}
            >
              <SkipBack size={18} fill="white" />
            </button>
            
            <button 
              onClick={handlePlayClick}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(59,130,246,0.3)',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isPlaying ? <Pause size={18} color="black" fill="black" /> : <Play size={18} color="black" fill="black" style={{ marginLeft: '3px' }} />}
            </button>
            
            <button 
              onClick={handleNextClick}
              className="btn-icon"
              style={{ width: '32px', height: '32px', color: 'white' }}
            >
              <SkipForward size={18} fill="white" />
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); toggleRepeat(); }}
              className={`btn-icon ${repeat !== 'none' ? 'active' : ''}`}
              style={{ width: '32px', height: '32px' }}
            >
              <Repeat size={15} />
              {repeat === 'one' && <span style={{ fontSize: '8px', position: 'absolute', bottom: '0px', fontWeight: '800' }}>1</span>}
            </button>
          </div>

          {/* Time Scrubber */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', onClick: (e) => e.stopPropagation() }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '35px', textAlign: 'right' }}>
              {formatTime(currentTime)}
            </span>
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                accentColor: 'var(--accent)',
                height: '4px',
                borderRadius: '2px',
                cursor: 'pointer',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '35px' }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right Aux Volume & Extras */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '30%', justifyContent: 'flex-end', minWidth: '220px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleLyrics(); }}
            className="btn-icon" 
            title="Lyrics"
          >
            <AlignLeft size={16} />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleQueue(); }}
            className="btn-icon" 
            title="Queue"
          >
            <ListMusic size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px', onClick: (e) => e.stopPropagation() }}>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleMute(); }} 
              className="btn-icon" 
              style={{ width: '30px', height: '30px' }}
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input 
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '80px',
                accentColor: 'var(--accent)',
                height: '4px',
                borderRadius: '2px',
                cursor: 'pointer',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* CSS adjustments mapping responsive views inside JavaScript */}
      <style>{`
        @media (max-width: 768px) {
          .player-bar-container {
            bottom: 64px; /* above bottom navigation */
            margin: 0 8px 8px 8px;
            width: calc(100% - 16px);
            border-radius: var(--radius-md);
            border: 1px solid var(--glass-border);
          }
          .mobile-player-only { display: flex !important; }
          .desktop-player-only { display: none !important; }
        }
        @media (min-width: 769px) {
          .player-bar-container {
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
          }
          .mobile-player-only { display: none !important; }
          .desktop-player-only { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
