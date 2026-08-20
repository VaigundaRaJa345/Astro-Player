import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const PlaybackContext = createContext(null);

export function PlaybackProvider({ children }) {
  const { user, refreshProfile } = useAuth();
  
  // Playback state
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(parseFloat(localStorage.getItem('astro_volume') || '0.8'));
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('none'); // 'none' | 'all' | 'one'
  
  // Queue state
  const [queue, setQueue] = useState([]);
  const [originalQueue, setOriginalQueue] = useState([]); // backup for shuffle toggles
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  
  // Interaction indices for fast UI rendering
  const [likedSongIds, setLikedSongIds] = useState(new Set());
  const [downloadedSongIds, setDownloadedSongIds] = useState(new Set());
  const [downloadProgress, setDownloadProgress] = useState({}); // songId -> progress percentage

  // Audio References
  const htmlAudioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const youtubeApiLoadedRef = useRef(false);

  // Initialize HTML5 Audio and load YouTube Player API
  useEffect(() => {
    // 1. Setup HTML5 Audio
    htmlAudioRef.current = new Audio();
    
    const audio = htmlAudioRef.current;
    audio.volume = volume;

    const onAudioPlay = () => setIsPlaying(true);
    const onAudioPause = () => setIsPlaying(false);
    const onAudioLoaded = () => setDuration(audio.duration || 0);
    const onAudioEnded = () => handleTrackEnded();
    const onAudioTimeUpdate = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('play', onAudioPlay);
    audio.addEventListener('pause', onAudioPause);
    audio.addEventListener('loadedmetadata', onAudioLoaded);
    audio.addEventListener('ended', onAudioEnded);
    audio.addEventListener('timeupdate', onAudioTimeUpdate);

    // 2. Load YouTube IFrame API compliant player
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Set target iframe receiver container
    const ytContainer = document.createElement('div');
    ytContainer.id = 'youtube-player-frame';
    ytContainer.className = 'youtube-hidden-player';
    document.body.appendChild(ytContainer);

    window.onYouTubeIframeAPIReady = () => {
      initializeYoutubePlayer();
    };

    if (window.YT && window.YT.Player) {
      initializeYoutubePlayer();
    }

    return () => {
      audio.removeEventListener('play', onAudioPlay);
      audio.removeEventListener('pause', onAudioPause);
      audio.removeEventListener('loadedmetadata', onAudioLoaded);
      audio.removeEventListener('ended', onAudioEnded);
      audio.removeEventListener('timeupdate', onAudioTimeUpdate);
      audio.pause();
      clearInterval(progressIntervalRef.current);
      
      const el = document.getElementById('youtube-player-frame');
      if (el) el.remove();
    };
  }, []);

  // Fetch initial liked & downloaded IDs on user change
  useEffect(() => {
    if (user) {
      loadLibraryIds();
    } else {
      setLikedSongIds(new Set());
      setDownloadedSongIds(new Set());
    }
  }, [user]);

  async function loadLibraryIds() {
    try {
      const liked = await api.getLikedSongs();
      setLikedSongIds(new Set(liked.songs.map(s => s.id)));
      
      const downloads = await api.getDownloads();
      setDownloadedSongIds(new Set(downloads.songs.map(s => s.id)));
    } catch (e) {
      console.warn('Error reading library indices', e);
      // Try local mock store
      const mock = api.getMockStore();
      setLikedSongIds(new Set(mock.get('liked_songs').map(s => s.id)));
      setDownloadedSongIds(new Set(mock.get('downloads').map(s => s.id)));
    }
  }

  function initializeYoutubePlayer() {
    if (youtubeApiLoadedRef.current) return;
    
    ytPlayerRef.current = new window.YT.Player('youtube-player-frame', {
      height: '100',
      width: '100',
      videoId: '',
      playerVars: {
        playsinline: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        enablejsapi: 1
      },
      events: {
        onReady: (event) => {
          youtubeApiLoadedRef.current = true;
          event.target.setVolume(volume * 100);
        },
        onStateChange: (event) => {
          // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            setDuration(ytPlayerRef.current.getDuration() || 0);
            startYtProgressTimer();
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
            clearInterval(progressIntervalRef.current);
          } else if (event.data === window.YT.PlayerState.ENDED) {
            clearInterval(progressIntervalRef.current);
            handleTrackEnded();
          }
        }
      }
    });
  }

  function startYtProgressTimer() {
    clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        setCurrentTime(ytPlayerRef.current.getCurrentTime());
      }
    }, 500);
  }

  // Handle song completion - triggers repeat or next track
  function handleTrackEnded() {
    if (repeat === 'one') {
      seek(0);
      play();
    } else {
      playNext();
    }
  }

  // Intercept offline assets if stored in Cache Storage
  async function resolveCachedPlaybackUrl(track) {
    if (track.source === 'youtube') return '';
    try {
      const cache = await caches.open('astro-player-audio');
      const response = await cache.match(track.playback_url);
      if (response) {
        console.log(`Playing local offline cached audio binary for: ${track.title}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.error('Error matching cached audio source:', e);
    }
    return track.playback_url;
  }

  // Core Play/Pause controls
  const play = () => {
    if (!currentTrack) return;
    
    if (currentTrack.source === 'youtube') {
      htmlAudioRef.current.pause();
      if (youtubeApiLoadedRef.current && ytPlayerRef.current) {
        ytPlayerRef.current.playVideo();
      }
    } else {
      if (youtubeApiLoadedRef.current && ytPlayerRef.current) {
        ytPlayerRef.current.pauseVideo();
      }
      htmlAudioRef.current.play().catch(e => console.warn('HTML Audio play error:', e));
    }
    setIsPlaying(true);
  };

  const pause = () => {
    if (currentTrack?.source === 'youtube') {
      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
    } else {
      htmlAudioRef.current.pause();
    }
    setIsPlaying(false);
    clearInterval(progressIntervalRef.current);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const seek = (time) => {
    const timeNum = Number(time);
    setCurrentTime(timeNum);
    if (currentTrack?.source === 'youtube') {
      if (ytPlayerRef.current) ytPlayerRef.current.seekTo(timeNum, true);
    } else {
      htmlAudioRef.current.currentTime = timeNum;
    }
  };

  const changeVolume = (newVol) => {
    const volFloat = parseFloat(newVol);
    setVolume(volFloat);
    localStorage.setItem('astro_volume', volFloat.toString());
    
    htmlAudioRef.current.volume = volFloat;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(volFloat * 100);
    }
  };

  const toggleMute = () => {
    const targetMute = !isMuted;
    setIsMuted(targetMute);
    htmlAudioRef.current.muted = targetMute;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
      if (targetMute) {
        ytPlayerRef.current.mute();
      } else {
        ytPlayerRef.current.unMute();
      }
    }
  };

  // Play track and sync history
  const playTrack = async (track, indexInQueue = -1) => {
    pause();
    setCurrentTime(0);
    
    // Auto-sync track details with Server database
    if (user && track.source === 'youtube') {
      api.syncSong(track).catch(e => console.warn('Could not sync song to server database', e));
    }

    setCurrentTrack(track);
    setIsPlaying(true);

    // Track Queue location
    if (indexInQueue !== -1) {
      setCurrentTrackIndex(indexInQueue);
    } else {
      // If not in queue, insert it after the current index and play it next
      const newQueue = [...queue];
      const nextIndex = currentTrackIndex + 1;
      newQueue.splice(nextIndex, 0, track);
      setQueue(newQueue);
      setOriginalQueue(newQueue);
      setCurrentTrackIndex(nextIndex);
    }

    // Load active source
    if (track.source === 'youtube') {
      if (ytPlayerRef.current && youtubeApiLoadedRef.current) {
        ytPlayerRef.current.loadVideoById(track.source_id);
      }
    } else {
      // Local/AstroOriginal - Check if cached offline
      const finalUrl = await resolveCachedPlaybackUrl(track);
      htmlAudioRef.current.src = finalUrl;
      htmlAudioRef.current.load();
      htmlAudioRef.current.play().catch(e => console.warn('Playback error', e));
    }

    // Log history
    if (user) {
      api.addHistory(track.id, track)
        .then(() => refreshProfile())
        .catch(e => console.warn('Failed logging listening history', e));
    }
  };

  // Queue Operations
  const playNext = () => {
    if (queue.length === 0) return;
    let nextIdx = currentTrackIndex + 1;
    
    if (nextIdx >= queue.length) {
      if (repeat === 'all') {
        nextIdx = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }
    
    playTrack(queue[nextIdx], nextIdx);
  };

  const playPrevious = () => {
    if (queue.length === 0) return;
    let prevIdx = currentTrackIndex - 1;

    if (prevIdx < 0) {
      if (repeat === 'all') {
        prevIdx = queue.length - 1;
      } else {
        seek(0);
        return;
      }
    }
    
    playTrack(queue[prevIdx], prevIdx);
  };

  const playCollection = (tracks, startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    setQueue(tracks);
    setOriginalQueue(tracks);
    setShuffle(false);
    playTrack(tracks[startIndex], startIndex);
  };

  const addToQueue = (track) => {
    if (queue.some(t => t.id === track.id)) return;
    setQueue(prev => [...prev, track]);
    setOriginalQueue(prev => [...prev, track]);
  };

  const removeFromQueue = (trackId) => {
    const newQueue = queue.filter(t => t.id !== trackId);
    setQueue(newQueue);
    setOriginalQueue(newQueue);
    
    // Recalculate index
    if (currentTrack?.id === trackId) {
      playNext();
    } else {
      const idx = newQueue.findIndex(t => t.id === currentTrack?.id);
      setCurrentTrackIndex(idx);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setOriginalQueue([]);
    setCurrentTrackIndex(-1);
    setCurrentTrack(null);
    pause();
  };

  const toggleShuffle = () => {
    const nextShuffle = !shuffle;
    setShuffle(nextShuffle);
    
    if (nextShuffle) {
      // Shuffle queue while keeping current track at current index or front
      const shuffled = [...queue];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      // Re-align active track
      if (currentTrack) {
        const activeIdx = shuffled.findIndex(t => t.id === currentTrack.id);
        if (activeIdx !== -1) {
          shuffled.splice(activeIdx, 1);
          shuffled.unshift(currentTrack);
        }
      }
      setQueue(shuffled);
      setCurrentTrackIndex(0);
    } else {
      // Revert to original order
      setQueue(originalQueue);
      if (currentTrack) {
        const activeIdx = originalQueue.findIndex(t => t.id === currentTrack.id);
        setCurrentTrackIndex(activeIdx !== -1 ? activeIdx : 0);
      }
    }
  };

  const toggleRepeat = () => {
    setRepeat(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  const reorderQueue = (startIndex, endIndex) => {
    const result = Array.from(queue);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    setQueue(result);
    setOriginalQueue(result);
    
    const activeIdx = result.findIndex(t => t.id === currentTrack?.id);
    setCurrentTrackIndex(activeIdx);
  };

  // Library Interactions
  const toggleLike = async (track) => {
    if (!user) return;
    const isLiked = likedSongIds.has(track.id);
    
    // Optimistic UI updates
    const nextLiked = new Set(likedSongIds);
    if (isLiked) {
      nextLiked.delete(track.id);
    } else {
      nextLiked.add(track.id);
    }
    setLikedSongIds(nextLiked);

    try {
      if (isLiked) {
        await api.unlikeSong(track.id);
      } else {
        await api.syncSong(track); // sync first
        await api.likeSong(track.id, track);
      }
      refreshProfile();
    } catch (e) {
      console.error('Failed toggling liked song state', e);
      // Revert on error
      loadLibraryIds();
    }
  };

  // Offline Caching & Downloader
  const downloadSong = async (track) => {
    if (!user) return;
    if (track.source === 'youtube') {
      alert('YouTube tracks are not eligible for offline downloads due to licensing restrictions.');
      return;
    }

    setDownloadProgress(prev => ({ ...prev, [track.id]: 1 }));

    try {
      console.log(`Downloading track: ${track.title}...`);
      
      // 1. Sync metadata with database first
      await api.syncSong(track);

      // 2. Fetch direct file binary and track progress
      const response = await fetch(track.playback_url);
      if (!response.ok) throw new Error('File download failed');
      
      // Read body reader for progress increments
      const reader = response.body.getReader();
      const contentLength = +response.headers.get('Content-Length') || 3000000; // default 3MB fallback
      
      let receivedLength = 0;
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        const percent = Math.min(Math.floor((receivedLength / contentLength) * 100), 99);
        setDownloadProgress(prev => ({ ...prev, [track.id]: percent }));
      }

      // 3. Assemble chunks and cache response
      const blob = new Blob(chunks);
      const cacheResponse = new Response(blob, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': blob.size.toString()
        }
      });
      
      const cache = await caches.open('astro-player-audio');
      await cache.put(track.playback_url, cacheResponse);

      // 4. Save record to server backend downloads table
      await api.addDownload(track.id, track, 'High');

      // Update states
      setDownloadedSongIds(prev => {
        const next = new Set(prev);
        next.add(track.id);
        return next;
      });
      setDownloadProgress(prev => ({ ...prev, [track.id]: 100 }));
      refreshProfile();

      // Clear indicator after a short delay
      setTimeout(() => {
        setDownloadProgress(prev => {
          const next = { ...prev };
          delete next[track.id];
          return next;
        });
      }, 2000);
      
    } catch (e) {
      console.error('Failed to download song', e);
      setDownloadProgress(prev => ({ ...prev, [track.id]: -1 })); // failed status
      setTimeout(() => {
        setDownloadProgress(prev => {
          const next = { ...prev };
          delete next[track.id];
          return next;
        });
      }, 3000);
    }
  };

  const removeDownload = async (trackId) => {
    try {
      const downloads = await api.getDownloads();
      const song = downloads.songs.find(s => s.id === trackId);
      if (song && song.playback_url) {
        const cache = await caches.open('astro-player-audio');
        await cache.delete(song.playback_url);
      }
      
      await api.removeDownload(trackId);
      setDownloadedSongIds(prev => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
      refreshProfile();
    } catch (e) {
      console.error('Error removing download', e);
    }
  };

  const clearAllDownloads = async () => {
    try {
      const cache = await caches.open('astro-player-audio');
      const keys = await cache.keys();
      for (const req of keys) {
        await cache.delete(req);
      }
      await api.clearDownloads();
      setDownloadedSongIds(new Set());
      refreshProfile();
    } catch (e) {
      console.error('Failed clearing downloads cache', e);
    }
  };

  return (
    <PlaybackContext.Provider value={{
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      shuffle,
      repeat,
      queue,
      currentTrackIndex,
      likedSongIds,
      downloadedSongIds,
      downloadProgress,
      play,
      pause,
      togglePlay,
      seek,
      changeVolume,
      toggleMute,
      playTrack,
      playNext,
      playPrevious,
      playCollection,
      addToQueue,
      removeFromQueue,
      clearQueue,
      toggleShuffle,
      toggleRepeat,
      reorderQueue,
      toggleLike,
      downloadSong,
      removeDownload,
      clearAllDownloads
    }}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
}
