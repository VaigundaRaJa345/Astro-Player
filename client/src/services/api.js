const API_BASE = '/api';

// Helper to get auth headers
function getHeaders() {
  const token = localStorage.getItem('astro_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Check if we are offline or server is unreachable
function isOffline() {
  return !navigator.onLine;
}

// Custom mock storage for offline mode
const mockStore = {
  get(key, defaultVal = []) {
    try {
      const data = localStorage.getItem(`astro_mock_${key}`);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(`astro_mock_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error('Error saving to mock store', e);
    }
  }
};

// Seed initial mock data for offline support if empty
if (!localStorage.getItem('astro_mock_playlists')) {
  mockStore.set('playlists', [
    {
      id: 'pl_mock_space',
      name: 'Deep Space Chill',
      description: 'Lofi and ambient soundscapes for stellar travel.',
      artwork: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=400&h=400&q=80',
      owner_id: 1,
      is_public: 1,
      song_count: 3
    }
  ]);
  mockStore.set('playlist_songs_pl_mock_space', [
    {
      id: 'astro_original_stellar',
      title: 'Stellar Drift',
      artist: 'Astro Project',
      album: 'Cosmic Horizons',
      artwork_url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=400&h=400&q=80',
      duration: 165,
      source: 'astro',
      source_id: 'stellar_drift',
      playback_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    },
    {
      id: 'astro_original_nebula',
      title: 'Nebula Whispers',
      artist: 'Cosmo Beats',
      album: 'Cosmic Horizons',
      artwork_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=400&h=400&q=80',
      duration: 218,
      source: 'astro',
      source_id: 'nebula_whispers',
      playback_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
    },
    {
      id: 'astro_original_pulsar',
      title: 'Pulsar Beats',
      artist: 'Lofi Orbit',
      album: 'Star Dust Lo-Fi',
      artwork_url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=400&h=400&q=80',
      duration: 302,
      source: 'astro',
      source_id: 'pulsar_beats',
      playback_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
    }
  ]);
}

// Request Wrapper with offline fallback
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    }
  };

  if (isOffline()) {
    throw new Error('NETWORK_OFFLINE');
  }

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.message === 'NETWORK_OFFLINE') {
      console.warn(`Server unreachable at ${url}, using offline local storage fallback.`);
      return handleOfflineFallback(endpoint, options);
    }
    throw err;
  }
}

// Offline fallback logic simulating database
function handleOfflineFallback(endpoint, options) {
  const method = options.method || 'GET';
  
  // Auth Profile
  if (endpoint.startsWith('/auth/profile')) {
    const mockUser = mockStore.get('user', { id: 1, username: 'Astro Explorer', email: 'explorer@astro.com' });
    const mockSettings = mockStore.get('settings', { playback_crossfade: 0, wifi_only: 0, download_quality: 'High', theme_color: 'blue' });
    const liked = mockStore.get('liked_songs', []);
    const playlists = mockStore.get('playlists', []);
    const downloads = mockStore.get('downloads', []);
    const history = mockStore.get('history', []);
    return {
      user: mockUser,
      settings: mockSettings,
      stats: {
        likedSongs: liked.length,
        playlists: playlists.length,
        songsPlayed: history.length,
        minutesListened: history.length * 3,
        downloads: downloads.length
      }
    };
  }

  // Auth Login/Register
  if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register')) {
    const body = JSON.parse(options.body || '{}');
    const user = { id: 1, username: body.username || 'Astro Explorer', email: body.email };
    localStorage.setItem('astro_token', 'offline_mock_token');
    mockStore.set('user', user);
    return { message: 'Offline access authorized', token: 'offline_mock_token', user };
  }

  // Playlists
  if (endpoint.startsWith('/playlists')) {
    // GET /playlists
    if (method === 'GET' && endpoint === '/playlists') {
      return { playlists: mockStore.get('playlists') };
    }
    // GET /playlists/:id
    if (method === 'GET' && endpoint.includes('/playlists/')) {
      const id = endpoint.split('/')[2];
      const playlists = mockStore.get('playlists');
      const playlist = playlists.find(p => p.id === id);
      if (!playlist) throw new Error('Playlist not found');
      const songs = mockStore.get(`playlist_songs_${id}`);
      return { playlist, songs };
    }
    // POST /playlists
    if (method === 'POST') {
      const body = JSON.parse(options.body);
      const playlists = mockStore.get('playlists');
      const newPl = {
        id: 'pl_mock_' + Math.random().toString(36).substring(2, 9),
        name: body.name,
        description: body.description || '',
        artwork: body.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&h=400&q=80',
        owner_id: 1,
        is_public: body.is_public ? 1 : 0,
        song_count: 0
      };
      playlists.unshift(newPl);
      mockStore.set('playlists', playlists);
      mockStore.set(`playlist_songs_${newPl.id}`, []);
      return { message: 'Playlist created', playlist: newPl };
    }
    // POST /playlists/:id/songs (Add Song)
    if (method === 'POST' && endpoint.includes('/songs')) {
      const id = endpoint.split('/')[2];
      const body = JSON.parse(options.body);
      
      // Get song metadata from default tracks or cache
      const songMetadata = body.song || { id: body.songId, title: 'Unknown Song', artist: 'Unknown Artist' };
      const playlistSongs = mockStore.get(`playlist_songs_${id}`);
      if (!playlistSongs.some(s => s.id === songMetadata.id)) {
        playlistSongs.push(songMetadata);
        mockStore.set(`playlist_songs_${id}`, playlistSongs);
      }

      // Update count
      const playlists = mockStore.get('playlists');
      const index = playlists.findIndex(p => p.id === id);
      if (index !== -1) {
        playlists[index].song_count = playlistSongs.length;
        mockStore.set('playlists', playlists);
      }

      return { message: 'Song added to playlist' };
    }
    // DELETE /playlists/:id/songs/:songId (Remove Song)
    if (method === 'DELETE' && endpoint.includes('/songs/')) {
      const parts = endpoint.split('/');
      const id = parts[2];
      const songId = parts[4];
      
      let playlistSongs = mockStore.get(`playlist_songs_${id}`);
      playlistSongs = playlistSongs.filter(s => s.id !== songId);
      mockStore.set(`playlist_songs_${id}`, playlistSongs);

      // Update count
      const playlists = mockStore.get('playlists');
      const index = playlists.findIndex(p => p.id === id);
      if (index !== -1) {
        playlists[index].song_count = playlistSongs.length;
        mockStore.set('playlists', playlists);
      }

      return { message: 'Song removed from playlist' };
    }
    // DELETE /playlists/:id (Delete Playlist)
    if (method === 'DELETE') {
      const id = endpoint.split('/')[2];
      let playlists = mockStore.get('playlists');
      playlists = playlists.filter(p => p.id !== id);
      mockStore.set('playlists', playlists);
      localStorage.removeItem(`astro_mock_playlist_songs_${id}`);
      return { message: 'Playlist deleted' };
    }
  }

  // Likes
  if (endpoint.startsWith('/songs/like')) {
    if (method === 'POST') {
      const body = JSON.parse(options.body);
      const liked = mockStore.get('liked_songs');
      const song = body.song || { id: body.songId, title: 'Unknown Song', artist: 'Unknown Artist' };
      if (!liked.some(s => s.id === song.id)) {
        liked.unshift(song);
        mockStore.set('liked_songs', liked);
      }
      return { message: 'Liked' };
    }
    if (method === 'DELETE') {
      const songId = endpoint.split('/').pop();
      let liked = mockStore.get('liked_songs');
      liked = liked.filter(s => s.id !== songId);
      mockStore.set('liked_songs', liked);
      return { message: 'Unliked' };
    }
  }
  if (endpoint === '/songs/likes') {
    return { songs: mockStore.get('liked_songs') };
  }

  // History
  if (endpoint === '/songs/history') {
    if (method === 'POST') {
      const body = JSON.parse(options.body);
      const history = mockStore.get('history');
      const song = body.song || { id: body.songId, title: 'Unknown Song', artist: 'Unknown Artist' };
      
      // Remove existing to place at top
      const filtered = history.filter(s => s.id !== song.id);
      filtered.unshift({ ...song, played_at: new Date().toISOString() });
      mockStore.set('history', filtered.slice(0, 50));
      return { message: 'History logged' };
    }
    return { history: mockStore.get('history') };
  }
  if (endpoint === '/songs/history' && method === 'DELETE') {
    mockStore.set('history', []);
    return { message: 'History cleared' };
  }

  // Downloads
  if (endpoint === '/songs/download') {
    if (method === 'POST') {
      const body = JSON.parse(options.body);
      const downloads = mockStore.get('downloads');
      const song = body.song || { id: body.songId, title: 'Unknown Song', artist: 'Unknown Artist' };
      if (!downloads.some(s => s.id === song.id)) {
        downloads.unshift({ ...song, downloaded_at: new Date().toISOString(), quality: body.quality || 'High' });
        mockStore.set('downloads', downloads);
      }
      return { message: 'Downloaded logged' };
    }
  }
  if (endpoint.startsWith('/songs/download/')) {
    if (method === 'DELETE') {
      const songId = endpoint.split('/').pop();
      let downloads = mockStore.get('downloads');
      downloads = downloads.filter(s => s.id !== songId);
      mockStore.set('downloads', downloads);
      return { message: 'Download removed' };
    }
  }
  if (endpoint === '/songs/downloads') {
    return { songs: mockStore.get('downloads') };
  }
  if (endpoint === '/songs/downloads' && method === 'DELETE') {
    mockStore.set('downloads', []);
    return { message: 'Downloads cleared' };
  }

  // Settings
  if (endpoint === '/auth/settings' && method === 'PUT') {
    const body = JSON.parse(options.body);
    const settings = mockStore.get('settings', {});
    const newSettings = { ...settings, ...body };
    mockStore.set('settings', newSettings);
    return { message: 'Settings updated offline', settings: newSettings };
  }

  // Default Astro Originals fallback
  if (endpoint === '/songs/featured') {
    return {
      songs: [
        {
          id: 'astro_original_stellar',
          title: 'Stellar Drift',
          artist: 'Astro Project',
          album: 'Cosmic Horizons',
          artwork_url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=400&h=400&q=80',
          duration: 165,
          source: 'astro',
          source_id: 'stellar_drift',
          playback_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          release_date: '2026'
        },
        {
          id: 'astro_original_nebula',
          title: 'Nebula Whispers',
          artist: 'Cosmo Beats',
          album: 'Cosmic Horizons',
          artwork_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=400&h=400&q=80',
          duration: 218,
          source: 'astro',
          source_id: 'nebula_whispers',
          playback_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          release_date: '2026'
        },
        {
          id: 'astro_original_pulsar',
          title: 'Pulsar Beats',
          artist: 'Lofi Orbit',
          album: 'Star Dust Lo-Fi',
          artwork_url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=400&h=400&q=80',
          duration: 302,
          source: 'astro',
          source_id: 'pulsar_beats',
          playback_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
          release_date: '2026'
        },
        {
          id: 'astro_original_aurora',
          title: 'Aurora Borealis',
          artist: 'Interstellar Ensemble',
          album: 'Deep Space Soundscapes',
          artwork_url: 'https://images.unsplash.com/photo-1524850301259-7729841967a5?auto=format&fit=crop&w=400&h=400&q=80',
          duration: 303,
          source: 'astro',
          source_id: 'aurora_borealis',
          playback_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
          release_date: '2026'
        },
        {
          id: 'astro_original_gravity',
          title: 'Zero Gravity',
          artist: 'Solar Flare',
          album: 'Star Dust Lo-Fi',
          artwork_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&h=400&q=80',
          duration: 254,
          source: 'astro',
          source_id: 'zero_gravity',
          playback_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
          release_date: '2025'
        }
      ]
    };
  }

  throw new Error(`Endpoint ${endpoint} not supported offline.`);
}

export const api = {
  // Auth
  register: (username, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getProfile: () => request('/auth/profile'),
  updateSettings: (settings) => request('/auth/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  // Playlists
  getPlaylists: () => request('/playlists'),
  getPlaylist: (id) => request(`/playlists/${id}`),
  createPlaylist: (name, description, artwork, is_public) => request('/playlists', { method: 'POST', body: JSON.stringify({ name, description, artwork, is_public }) }),
  updatePlaylist: (id, data) => request(`/playlists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlaylist: (id) => request(`/playlists/${id}`, { method: 'DELETE' }),
  addSongToPlaylist: (playlistId, songId, songMetadata) => request(`/playlists/${playlistId}/songs`, { method: 'POST', body: JSON.stringify({ songId, song: songMetadata }) }),
  removeSongFromPlaylist: (playlistId, songId) => request(`/playlists/${playlistId}/songs/${songId}`, { method: 'DELETE' }),

  // Music metadata syncing
  syncSong: (song) => request('/songs/sync', { method: 'POST', body: JSON.stringify(song) }),
  getFeatured: () => request('/songs/featured'),

  // Likes
  likeSong: (songId, songMetadata) => request('/songs/like', { method: 'POST', body: JSON.stringify({ songId, song: songMetadata }) }),
  unlikeSong: (songId) => request(`/songs/like/${songId}`, { method: 'DELETE' }),
  getLikedSongs: () => request('/songs/likes'),

  // History
  addHistory: (songId, songMetadata) => request('/songs/history', { method: 'POST', body: JSON.stringify({ songId, song: songMetadata }) }),
  getHistory: () => request('/songs/history'),
  clearHistory: () => request('/songs/history', { method: 'DELETE' }),

  // Downloads
  addDownload: (songId, songMetadata, quality) => request('/songs/download', { method: 'POST', body: JSON.stringify({ songId, song: songMetadata, quality }) }),
  removeDownload: (songId) => request(`/songs/download/${songId}`, { method: 'DELETE' }),
  getDownloads: () => request('/songs/downloads'),
  clearDownloads: () => request('/songs/downloads', { method: 'DELETE' }),

  // Helper utilities
  isOffline,
  getMockStore: () => mockStore
};
