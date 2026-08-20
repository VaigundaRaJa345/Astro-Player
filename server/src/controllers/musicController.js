import { query } from '../config/db.js';

// Server-side in-memory search cache to preserve API quota
const searchCache = new Map();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours TTL

// Periodically clean cache to prevent memory bloat
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      searchCache.delete(key);
    }
  }
}, 60 * 60 * 1000); // clean every hour

// Parse ISO 8601 duration format (e.g. PT3M45S) into seconds
function parseISO8601Duration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// Advanced YouTube title cleaner for Tamil songs
function cleanTitleDetails(rawTitle, channelTitle) {
  let cleanTitle = rawTitle
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\(Official (Video|Audio|Music Video|Lyrical|Lyric Video|Song)\)/gi, '')
    .replace(/\[Official (Video|Audio|Music Video|Lyrical|Lyric Video|Song)\]/gi, '')
    .replace(/\bVideo Song\b/gi, '')
    .replace(/\bLyrical Video\b/gi, '')
    .replace(/\bLyric Video\b/gi, '')
    .replace(/\bLyrical Song\b/gi, '')
    .replace(/\(Video\)/gi, '')
    .replace(/\[Video\]/gi, '')
    .replace(/\(Lyrical\)/gi, '')
    .replace(/\[Lyrical\]/gi, '')
    .replace(/\(Audio\)/gi, '')
    .replace(/\[Audio\]/gi, '')
    .replace(/\b(hd|4k|1080p|full hd)\b/gi, '')
    .trim();

  let titlePart = cleanTitle;
  let moviePart = 'Tamil Single';
  let artistPart = channelTitle.replace(/ - Topic$/i, '');

  // 1. Try to split by Pipe characters
  const partsByBar = cleanTitle.split('|').map(p => p.trim());
  if (partsByBar.length > 1) {
    const firstPart = partsByBar[0];
    const secondPart = partsByBar[1];

    const hyphenParts = firstPart.split('-').map(p => p.trim());
    if (hyphenParts.length > 1) {
      titlePart = hyphenParts[0];
      moviePart = hyphenParts[1];
    } else {
      titlePart = firstPart;
      moviePart = secondPart;
    }
  } else {
    // 2. Try to split by hyphens
    const partsByHyphen = cleanTitle.split('-').map(p => p.trim());
    if (partsByHyphen.length > 1) {
      titlePart = partsByHyphen[0];
      moviePart = partsByHyphen[1];
    }
  }

  // 3. Scan title and match known popular composers
  const composers = [
    'Anirudh Ravichander', 'Anirudh', 'A.R. Rahman', 'A. R. Rahman', 'AR Rahman', 
    'Ilaiyaraaja', 'Yuvan Shankar Raja', 'Yuvan', 'Harris Jayaraj', 
    'Santhosh Narayanan', 'G.V. Prakash Kumar', 'G.V. Prakash', 'Dhibu Ninan Thomas'
  ];
  
  for (const c of composers) {
    if (rawTitle.toLowerCase().includes(c.toLowerCase())) {
      artistPart = c;
      break;
    }
  }

  // 4. Final sanitization
  titlePart = titlePart.replace(/lyric(al)?/gi, '').replace(/^[-+*|\s:]+|[-+*|\s:]+$/g, '').trim();
  moviePart = moviePart.replace(/lyric(al)?/gi, '').replace(/^[-+*|\s:]+|[-+*|\s:]+$/g, '').trim();

  if (titlePart.length > 0) {
    titlePart = titlePart.charAt(0).toUpperCase() + titlePart.slice(1);
  }
  if (moviePart.length > 0 && moviePart.toLowerCase() !== 'tamil single') {
    moviePart = moviePart.charAt(0).toUpperCase() + moviePart.slice(1);
  }

  return {
    title: titlePart || rawTitle,
    album: moviePart || 'Tamil Single',
    artist: artistPart || channelTitle
  };
}

// Search YouTube and format as song schema (Optimized for Tamil query ranking & caching)
export async function searchSongs(req, res) {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  // 1. Check local cache
  const cacheKey = q.trim().toLowerCase();
  if (searchCache.has(cacheKey)) {
    const entry = searchCache.get(cacheKey);
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      console.log(`Resolving search results from cache for: "${q}"`);
      return res.json({ songs: entry.songs });
    } else {
      searchCache.delete(cacheKey);
    }
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'YouTube API key not configured on server' });
  }

  try {
    // 2. Normalize search queries (support Tanglish and English inputs to direct target Tamil content)
    let normalizedQ = q.trim();
    const hasTamilSymbols = /[\u0B80-\u0BFF]/.test(normalizedQ);

    if (!hasTamilSymbols) {
      const lowerQ = normalizedQ.toLowerCase();
      const isAlreadyTamilTargeted = lowerQ.includes('tamil') || lowerQ.includes('kollywood');

      if (!isAlreadyTamilTargeted) {
        // scan list of popular movie music & artists
        const moviesList = ['jailer', 'leo', 'vikram', '96', 'vaaranam aayiram', 'alaipayuthey', 'kabali', 'master', 'beast', 'varisu', 'thunivu', 'kolaveri', 'arabic kuthu', 'kaavaalaa', 'vaa vaathi', 'enjoy enjaami', 'munbe vaa', 'vaseegara', 'nenjukkul peidhidum', 'anbe en anbe', 'sillunu oru kadhal'];
        const composersList = ['anirudh', 'rahman', 'ilaiyaraaja', 'yuvan', 'harris jayaraj', 'santhosh narayanan', 'gv prakash', 'gvp', 'dhibu ninan'];
        
        const matchedMovie = moviesList.find(m => lowerQ.includes(m));
        const matchedComposer = composersList.find(c => lowerQ.includes(c));

        if (matchedMovie && !lowerQ.includes('song')) {
          normalizedQ = `${normalizedQ} tamil song`;
        } else if (matchedComposer && !lowerQ.includes('song')) {
          normalizedQ = `${normalizedQ} tamil songs`;
        } else if (!lowerQ.includes('song')) {
          normalizedQ = `${normalizedQ} tamil song`;
        }
      }
    }

    console.log(`Executing YouTube Search. Raw query: "${q}" | Normalized: "${normalizedQ}"`);

    // 3. Query YouTube search
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(normalizedQ)}&type=video&maxResults=20&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    
    if (!searchRes.ok) {
      const err = await searchRes.json();
      console.error('YouTube Search API error:', err);
      return res.status(searchRes.status).json({ error: err.error?.message || 'YouTube search service failed' });
    }

    const searchData = await searchRes.json();
    const items = searchData.items || [];
    if (items.length === 0) {
      // Save empty cache to avoid repeating query
      searchCache.set(cacheKey, { timestamp: Date.now(), songs: [] });
      return res.json({ songs: [] });
    }

    const videoIds = items.map(item => item.id.videoId).filter(Boolean);

    // 4. Fetch details to get duration
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds.join(',')}&key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl);
    
    if (!detailsRes.ok) {
      return res.status(detailsRes.status).json({ error: 'Failed to retrieve detailed metadata' });
    }

    const detailsData = await detailsRes.json();
    const detailsItems = detailsData.items || [];

    // 5. Clean metadata and calculate weight scores for ranking intelligence
    const premiumPublishers = [
      'sony music south', 'saregama tamil', 'think music india', 'tips tamil', 
      'lahari music', 'muzik247', 'divo music', 'junglee music south', 
      'aditya music', 'sun pictures', 't-series tamil', 'tseries tamil', 
      'divomuse', 'thinkmusic', 'saregamadevtamil'
    ];

    let songs = detailsItems.map(item => {
      const durationSec = parseISO8601Duration(item.contentDetails?.duration || '');
      const rawTitle = item.snippet?.title || 'Unknown Title';
      const channelTitle = item.snippet?.channelTitle || 'Unknown Channel';
      
      const cleanDetails = cleanTitleDetails(rawTitle, channelTitle);
      
      // Calculate search ranking score based on channel authority
      let score = 0;
      const lowerChannel = channelTitle.toLowerCase();
      const lowerTitle = rawTitle.toLowerCase();

      // Priority 1: Match premium Tamil music label channel names
      const isPremiumLabel = premiumPublishers.some(pub => lowerChannel.includes(pub));
      if (isPremiumLabel) score += 100;

      // Priority 2: Official lyric or movie video descriptors in the title
      if (lowerTitle.includes('official lyrical') || lowerTitle.includes('lyric video') || lowerTitle.includes('video song')) {
        score += 50;
      }

      // Priority 3: Composer Topic channels
      if (lowerChannel.includes('topic')) {
        score += 30;
      }

      return {
        id: `yt_${item.id}`,
        title: cleanDetails.title,
        artist: cleanDetails.artist,
        album: cleanDetails.album,
        artwork_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
        duration: durationSec || 180,
        source: 'youtube',
        source_id: item.id,
        playback_url: '',
        release_date: item.snippet?.publishedAt?.substring(0, 4) || '',
        score // temporary field for sorting
      };
    });

    // 6. Sort results by our computed weight scores
    songs.sort((a, b) => b.score - a.score);

    // Remove the temporary score field
    songs = songs.map(({ score, ...rest }) => rest);

    // 7. Store in local in-memory cache
    searchCache.set(cacheKey, { timestamp: Date.now(), songs });

    res.json({ songs });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error during search' });
  }
}

// Sync song metadata to local DB so we can reference it in playlists/likes/history
export async function syncSong(req, res) {
  const { id, title, artist, album, artwork_url, duration, source, source_id, playback_url, release_date } = req.body;

  if (!id || !title || !artist) {
    return res.status(400).json({ error: 'Song ID, title, and artist are required' });
  }

  try {
    // Check if song exists
    const check = await query('SELECT id FROM songs WHERE id = $1', [id]);
    if (check.rowCount === 0) {
      await query(
        `INSERT INTO songs (id, title, artist, album, artwork_url, duration, source, source_id, playback_url, release_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, title, artist, album, artwork_url, duration, source, source_id, playback_url || '', release_date || '']
      );
    }
    res.json({ message: 'Song synced successfully' });
  } catch (err) {
    console.error('Sync song error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get Astro Originals / seeded tracks
export async function getFeatured(req, res) {
  try {
    const result = await query('SELECT * FROM songs WHERE source = $1', ['astro']);
    res.json({ songs: result.rows });
  } catch (err) {
    console.error('Get featured error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Liked Songs
export async function likeSong(req, res) {
  const userId = req.user.id;
  const { songId } = req.body;

  if (!songId) {
    return res.status(400).json({ error: 'Song ID is required' });
  }

  try {
    // Insert if not exists
    const check = await query('SELECT user_id FROM liked_songs WHERE user_id = $1 AND song_id = $2', [userId, songId]);
    if (check.rowCount === 0) {
      await query('INSERT INTO liked_songs (user_id, song_id) VALUES ($1, $2)', [userId, songId]);
    }
    res.json({ message: 'Song liked successfully' });
  } catch (err) {
    console.error('Like song error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function unlikeSong(req, res) {
  const userId = req.user.id;
  const { songId } = req.params;

  try {
    await query('DELETE FROM liked_songs WHERE user_id = $1 AND song_id = $2', [userId, songId]);
    res.json({ message: 'Song unliked successfully' });
  } catch (err) {
    console.error('Unlike song error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getLikedSongs(req, res) {
  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT s.*, l.liked_at 
       FROM songs s
       JOIN liked_songs l ON s.id = l.song_id
       WHERE l.user_id = $1
       ORDER BY l.liked_at DESC`,
      [userId]
    );
    res.json({ songs: result.rows });
  } catch (err) {
    console.error('Get liked songs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Listening History
export async function addHistory(req, res) {
  const userId = req.user.id;
  const { songId } = req.body;

  if (!songId) {
    return res.status(400).json({ error: 'Song ID is required' });
  }

  try {
    await query('INSERT INTO listening_history (user_id, song_id) VALUES ($1, $2)', [userId, songId]);
    res.json({ message: 'Listening history logged successfully' });
  } catch (err) {
    console.error('Add history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getHistory(req, res) {
  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT s.*, h.played_at 
       FROM songs s
       JOIN listening_history h ON s.id = h.song_id
       WHERE h.user_id = $1
       ORDER BY h.played_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json({ history: result.rows });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function clearHistory(req, res) {
  const userId = req.user.id;

  try {
    await query('DELETE FROM listening_history WHERE user_id = $1', [userId]);
    res.json({ message: 'History cleared successfully' });
  } catch (err) {
    console.error('Clear history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Downloads
export async function addDownload(req, res) {
  const userId = req.user.id;
  const { songId, quality } = req.body;

  if (!songId) {
    return res.status(400).json({ error: 'Song ID is required' });
  }

  try {
    const check = await query('SELECT user_id FROM downloads WHERE user_id = $1 AND song_id = $2', [userId, songId]);
    if (check.rowCount === 0) {
      await query(
        'INSERT INTO downloads (user_id, song_id, download_status, quality) VALUES ($1, $2, $3, $4)',
        [userId, songId, 'downloaded', quality || 'High']
      );
    }
    res.json({ message: 'Download logged successfully' });
  } catch (err) {
    console.error('Add download error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeDownload(req, res) {
  const userId = req.user.id;
  const { songId } = req.params;

  try {
    await query('DELETE FROM downloads WHERE user_id = $1 AND song_id = $2', [userId, songId]);
    res.json({ message: 'Download removed successfully' });
  } catch (err) {
    console.error('Remove download error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDownloads(req, res) {
  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT s.*, d.downloaded_at, d.quality 
       FROM songs s
       JOIN downloads d ON s.id = d.song_id
       WHERE d.user_id = $1
       ORDER BY d.downloaded_at DESC`,
      [userId]
    );
    res.json({ songs: result.rows });
  } catch (err) {
    console.error('Get downloads error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function clearDownloads(req, res) {
  const userId = req.user.id;

  try {
    await query('DELETE FROM downloads WHERE user_id = $1', [userId]);
    res.json({ message: 'Downloads cleared successfully' });
  } catch (err) {
    console.error('Clear downloads error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
