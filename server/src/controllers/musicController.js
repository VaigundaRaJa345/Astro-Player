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

// Language detection helper
function detectLanguage(queryText) {
  const hasTamil = /[\u0B80-\u0BFF]/.test(queryText);
  if (hasTamil) return 'ta';

  const lower = queryText.toLowerCase();
  const tamilKeywords = [
    'tamil', 'song', 'anirudh', 'rahman', 'ilaiyaraaja', 'yuvan', 'harris', 'santhosh', 
    'gv prakash', 'gvp', 'saregama', 'sony', 'think music', 'hukum', 'kaavaalaa', 'munbe', 'vaa', 
    'vaseegara', 'leo', 'jailer', 'vikram', '96', 'alaipayuthey'
  ];
  const hasTamilKeywords = tamilKeywords.some(kw => lower.includes(kw));
  if (hasTamilKeywords) return 'ta';
  
  const englishOnlyKeywords = ['shape of you', 'blinding lights', 'perfect', 'believer', 'marshmello', 'taylor swift', 'eminem', 'coldplay', 'ed sheeran', 'justin bieber'];
  const hasEnglishOnly = englishOnlyKeywords.some(kw => lower.includes(kw));
  if (hasEnglishOnly) return 'en';

  return 'ta'; // default to ta for this Tamil-first player
}

// Astro Relevance Scoring helper
function calculateRelevanceScore(song, queryText) {
  let score = 0;
  const qLower = queryText.toLowerCase().trim();
  const titleLower = song.title.toLowerCase();
  const originalTitleLower = song.originalTitle.toLowerCase();
  const descLower = song.description.toLowerCase();
  const channelLower = song.channelTitle.toLowerCase();

  // 1. Exact title match (after cleaning)
  if (titleLower === qLower || originalTitleLower === qLower) {
    score += 100;
  }
  // 2. Query appears as complete phrase in title
  else if (titleLower.includes(qLower) || originalTitleLower.includes(qLower)) {
    score += 80;
  }
  // 3. Query words appear individually in title
  else {
    const qWords = qLower.split(/\s+/).filter(Boolean);
    const matchedWords = qWords.filter(word => titleLower.includes(word) || originalTitleLower.includes(word));
    if (matchedWords.length === qWords.length && qWords.length > 0) {
      score += 50; // Query appears in title (all words match)
    } else if (matchedWords.length > 0) {
      score += 30; // Query words appear individually
    }
  }

  // 4. Query appears in description
  if (descLower.includes(qLower)) {
    score += 15;
  }

  // 5. Positive Music Signals (+20)
  const positiveSignals = ['official', 'music video', 'full video', 'lyric video', 'audio', 'song', 'tamil', 'original'];
  const hasPositiveSignal = positiveSignals.some(sig => originalTitleLower.includes(sig));
  if (hasPositiveSignal) {
    score += 20;
  }

  // 6. Premium Publisher Channel (+20)
  const premiumPublishers = [
    'sony music south', 'saregama tamil', 'think music india', 'tips tamil', 
    'lahari music', 'muzik247', 'divo music', 'junglee music south', 
    'aditya music', 'sun pictures', 't-series tamil', 'tseries tamil', 
    'divomuse', 'thinkmusic', 'saregamadevtamil'
  ];
  const isPremiumLabel = premiumPublishers.some(pub => channelLower.includes(pub));
  if (isPremiumLabel) {
    score += 20;
  }

  // 7. Tamil-related metadata (+15)
  const hasTamilScript = /[\u0B80-\u0BFF]/.test(originalTitleLower) || /[\u0B80-\u0BFF]/.test(descLower);
  if (hasTamilScript || originalTitleLower.includes('tamil') || channelLower.includes('tamil')) {
    score += 15;
  }

  // 8. Artist/Composer match (+30) & Movie match (+30)
  const moviesList = ['jailer', 'leo', 'vikram', '96', 'vaaranam aayiram', 'alaipayuthey', 'kabali', 'master', 'beast', 'varisu', 'thunivu', 'kolaveri', 'arabic kuthu', 'kaavaalaa', 'vaa vaathi', 'enjoy enjaami', 'munbe vaa', 'vaseegara', 'nenjukkul peidhidum', 'anbe en anbe', 'sillunu oru kadhal'];
  const composersList = ['anirudh', 'rahman', 'ilaiyaraaja', 'yuvan', 'harris jayaraj', 'santhosh narayanan', 'gv prakash', 'gvp', 'dhibu ninan'];
  
  const matchedMovie = moviesList.find(m => originalTitleLower.includes(m) || qLower.includes(m));
  const matchedComposer = composersList.find(c => originalTitleLower.includes(c) || qLower.includes(c));

  if (matchedMovie) score += 30;
  if (matchedComposer) score += 30;

  // 9. Negative/low priority signals (-50)
  const negativeSignals = ['reaction', 'review', 'explanation', 'tutorial', 'cover', 'remix', 'mashup', 'shorts', 'status', 'edit', 'fan made', 'gameplay'];
  const hasNegativeSignal = negativeSignals.some(sig => originalTitleLower.includes(sig));
  const userWantsCoverOrRemix = qLower.includes('cover') || qLower.includes('remix') || qLower.includes('mashup');
  if (hasNegativeSignal && !userWantsCoverOrRemix) {
    score -= 50;
  }

  // 10. Non-music content (-40)
  const nonMusicKeywords = ['interview', 'promo', 'trailer', 'teaser', 'vlog', 'behind the scenes', 'making of', 'press meet', 'success meet'];
  const isNonMusic = nonMusicKeywords.some(kw => originalTitleLower.includes(kw));
  if (isNonMusic) {
    score -= 40;
  }

  return score;
}

// Search YouTube and format as song schema (Optimized for Tamil query ranking & caching)
export async function searchSongs(req, res) {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const cacheKey = q.trim().toLowerCase();
  const cacheId = `search_${cacheKey}`;
  const now = new Date();
  const nowStr = now.toISOString();

  try {
    // 1. Check persistent cache
    const cacheResult = await query(
      'SELECT * FROM youtube_cache WHERE id = $1',
      [cacheId]
    );

    if (cacheResult.rows && cacheResult.rows.length > 0) {
      const cachedItem = cacheResult.rows[0];
      const expiresAt = new Date(cachedItem.expires_at);

      // Increment access stats in background
      query(
        'UPDATE youtube_cache SET last_accessed_at = $1, access_count = access_count + 1 WHERE id = $2',
        [nowStr, cacheId]
      ).catch(e => console.error('Failed to update cache access count:', e));

      const cachedSongs = JSON.parse(cachedItem.data);

      if (expiresAt > now) {
        // Active cache hit!
        await logApiUsage('search', 'hit', q);
        console.log(`[SEARCH] CACHE HIT for query: "${q}"`);
        return res.json({ songs: cachedSongs });
      } else {
        // Expired cache hit! Stale-While-Revalidate
        await logApiUsage('search', 'stale_hit', q);
        console.log(`[SEARCH] STALE CACHE HIT for query: "${q}". Returning stale data and revalidating in background...`);
        
        // Return stale data immediately
        res.json({ songs: cachedSongs });

        // Trigger background revalidation
        revalidateSearch(q, cacheId, cacheKey).catch(err => {
          console.error(`[SEARCH] Background revalidation failed for "${q}":`, err);
        });
        return;
      }
    }

    // 2. Cache miss: Fetch from YouTube
    console.log(`[SEARCH] CACHE MISS for query: "${q}"`);
    await logApiUsage('search', 'miss', q);
    await fetchAndCacheSearch(q, cacheId, cacheKey, res);

  } catch (err) {
    console.error('SEARCH QUERY:\n' + q + '\n\nYOUTUBE REQUEST:\nFAILED\n\nERROR:\n', err);

    let status = 500;
    let errCode = 'UNKNOWN_ERROR';
    let userMsg = 'YouTube search is temporarily unavailable.';

    if (err.status) {
      status = err.status;
      const code = err.code;
      if (code === 'quotaExceeded') {
        errCode = 'QUOTA_EXCEEDED';
        userMsg = 'YouTube search limit reached. Cached results are still available.';
      } else if (code === 'keyInvalid') {
        errCode = 'INVALID_API_KEY';
        userMsg = 'Music search configuration error.';
      } else {
        errCode = 'YOUTUBE_API_ERROR';
        userMsg = err.message || 'YouTube search service failed';
      }
    } else if (err.name === 'FetchError' || err.message?.includes('fetch')) {
      errCode = 'NETWORK_ERROR';
      userMsg = 'Unable to connect to YouTube. Check your internet connection.';
    }

    res.status(status).json({ 
      error: userMsg,
      code: errCode
    });
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

// Caching Helper: logs hits/misses/errors to api_usage_logs
async function logApiUsage(requestType, status, queryOrId) {
  try {
    await query(
      'INSERT INTO api_usage_logs (request_type, status, query_or_id) VALUES ($1, $2, $3)',
      [requestType, status, queryOrId]
    );
  } catch (err) {
    console.error('Failed to log API usage:', err);
  }
}

// Revalidate search results in the background (Stale-While-Revalidate)
async function revalidateSearch(q, cacheId, cacheKey) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return;
  try {
    const songs = await fetchYouTubeSearch(q, apiKey);
    const nowStr = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const clientSongs = songs.map(({ score, ...rest }) => rest);

    await query(
      `UPDATE youtube_cache 
       SET data = $1, expires_at = $2, last_accessed_at = $3, access_count = access_count + 1 
       WHERE id = $4`,
      [JSON.stringify(clientSongs), expiresAt, nowStr, cacheId]
    );
    console.log(`[SEARCH] Background revalidation completed successfully for query: "${q}"`);
  } catch (err) {
    console.error(`[SEARCH] Background revalidation failed for query "${q}":`, err);
  }
}

// Perform active YouTube search, save to cache, and respond to user
async function fetchAndCacheSearch(q, cacheId, cacheKey, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Music search configuration error.', 
      code: 'INVALID_API_KEY' 
    });
  }

  try {
    const songs = await fetchYouTubeSearch(q, apiKey);

    // Backend debug logging (Rule 28)
    console.log(`
SEARCH QUERY:
${q}

CACHE:
MISS

YOUTUBE REQUEST:
SUCCESS

RESULTS RECEIVED:
25

RESULTS AFTER FILTER:
${songs.length}

TOP RESULT:
${songs[0] ? songs[0].title : 'None'}

TOP SCORE:
${songs[0] ? songs[0].score : 'None'}
    `);

    const nowStr = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const check = await query('SELECT id FROM youtube_cache WHERE id = $1', [cacheId]);
    const clientSongs = songs.map(({ score, ...rest }) => rest);

    if (check.rows && check.rows.length > 0) {
      await query(
        `UPDATE youtube_cache SET data = $1, expires_at = $2, last_accessed_at = $3 WHERE id = $4`,
        [JSON.stringify(clientSongs), expiresAt, nowStr, cacheId]
      );
    } else {
      await query(
        `INSERT INTO youtube_cache (id, cache_key, cache_type, query, data, expires_at, created_at, last_accessed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [cacheId, cacheKey, 'search', q, JSON.stringify(clientSongs), expiresAt, nowStr, nowStr]
      );
    }

    res.json({ songs: clientSongs });
  } catch (err) {
    throw err; // throw to caller (searchSongs) to log & format cleanly
  }
}

// Core helper that communicates with YouTube search APIs
async function fetchYouTubeSearch(q, apiKey) {
  let normalizedQ = q.trim();
  normalizedQ = normalizedQ.normalize('NFC');

  const lang = detectLanguage(normalizedQ);
  console.log(`[YOUTUBE] Detecting language for query "${normalizedQ}": ${lang}`);

  // Base YouTube search parameters (videoCategoryId=10, videoEmbeddable=true, maxResults=25)
  let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(normalizedQ)}&type=video&maxResults=25&videoEmbeddable=true&key=${apiKey}`;
  
  if (lang === 'ta') {
    searchUrl += `&regionCode=IN&relevanceLanguage=ta`;
  } else {
    searchUrl += `&relevanceLanguage=en`;
  }

  // Prioritize music category
  const musicSearchUrl = `${searchUrl}&videoCategoryId=10`;
  console.log(`[YOUTUBE] Fetching YouTube search for query "${normalizedQ}" (Music Category)`);
  
  let searchRes = await fetch(musicSearchUrl);
  let searchData;
  let items = [];

  if (searchRes.ok) {
    searchData = await searchRes.json();
    items = searchData.items || [];
  } else {
    const err = await searchRes.json();
    console.error(`[YOUTUBE] YouTube Search failed with status ${searchRes.status}:`, err);
    throw {
      status: searchRes.status,
      code: err.error?.errors?.[0]?.reason || 'unknown',
      message: err.error?.message || 'YouTube search API call failed'
    };
  }

  // Fallback: If no results found in Music category, try generic search to avoid over-filtering
  if (items.length === 0) {
    console.log(`[YOUTUBE] No results in Music Category. Retrying query without category filter...`);
    searchRes = await fetch(searchUrl);
    if (searchRes.ok) {
      searchData = await searchRes.json();
      items = searchData.items || [];
    } else {
      const err = await searchRes.json();
      throw {
        status: searchRes.status,
        code: err.error?.errors?.[0]?.reason || 'unknown',
        message: err.error?.message || 'YouTube search API call failed'
      };
    }
  }

  if (items.length === 0) return [];

  const videoIds = items.map(item => item.id.videoId).filter(Boolean);

  const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds.join(',')}&key=${apiKey}`;
  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) {
    throw new Error('Failed to retrieve detailed metadata');
  }

  const detailsData = await detailsRes.json();
  const detailsItems = detailsData.items || [];

  let songs = detailsItems.map(item => {
    const durationSec = parseISO8601Duration(item.contentDetails?.duration || '');
    const rawTitle = item.snippet?.title || 'Unknown Title';
    const channelTitle = item.snippet?.channelTitle || 'Unknown Channel';
    
    const cleanDetails = cleanTitleDetails(rawTitle, channelTitle);
    
    const songObj = {
      id: `yt_${item.id}`,
      title: cleanDetails.title,
      originalTitle: rawTitle,
      artist: cleanDetails.artist,
      album: cleanDetails.album || '',
      artwork_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
      duration: durationSec || 180,
      source: 'youtube',
      source_id: item.id,
      playback_url: '',
      release_date: item.snippet?.publishedAt?.substring(0, 4) || '',
      description: item.snippet?.description || '',
      channelTitle: channelTitle
    };

    const score = calculateRelevanceScore(songObj, q);
    songObj.score = score;
    return songObj;
  });

  songs.sort((a, b) => b.score - a.score);
  return songs;
}

// Dynamic prefix suggestions endpoint controller
export async function getSearchSuggestions(req, res) {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ suggestions: [] });
  }
  const prefix = `%${q.trim().toLowerCase()}%`;
  try {
    const result = await query(
      "SELECT DISTINCT query FROM youtube_cache WHERE cache_type = 'search' AND query LIKE $1 LIMIT 5",
      [prefix]
    );
    const suggestions = result.rows.map(row => row.query).filter(Boolean);

    // Fallback: If suggestions list is empty, filter from default popular terms
    if (suggestions.length === 0) {
      const defaultSeeds = ['Hukum', 'Leo songs', 'Arabic Kuthu', 'Kaavaalaa', 'Munbe Vaa', 'Vaseegara', 'Enjoy Enjaami', 'Anirudh hits', 'A.R. Rahman', 'Ilaiyaraaja'];
      const filtered = defaultSeeds.filter(term => term.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 5);
      return res.json({ suggestions: filtered });
    }

    res.json({ suggestions });
  } catch (err) {
    console.error('Failed to get search suggestions:', err);
    res.json({ suggestions: [] });
  }
}

// 1. Manual Cache Item (Song or Playlist metadata for 7 days)
export async function manualCacheItem(req, res) {
  const { id, type, data } = req.body;
  if (!id || !type || !data) {
    return res.status(400).json({ error: 'ID, type, and data are required' });
  }

  const cacheKey = id.trim();
  const nowStr = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const check = await query('SELECT id FROM youtube_cache WHERE id = $1', [id]);
    if (check.rows && check.rows.length > 0) {
      await query(
        `UPDATE youtube_cache 
         SET data = $1, expires_at = $2, is_pinned = 1, last_accessed_at = $3, cache_type = $4 
         WHERE id = $5`,
        [JSON.stringify(data), expiresAt, nowStr, type, id]
      );
    } else {
      await query(
        `INSERT INTO youtube_cache (id, cache_key, cache_type, data, expires_at, created_at, last_accessed_at, is_pinned)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
        [id, cacheKey, type, JSON.stringify(data), expiresAt, nowStr, nowStr]
      );
    }

    // Sync song details to standard songs table if it's a song
    if (type === 'song') {
      const songCheck = await query('SELECT id FROM songs WHERE id = $1', [id]);
      if (songCheck.rows && songCheck.rows.length === 0) {
        await query(
          `INSERT INTO songs (id, title, artist, album, artwork_url, duration, source, source_id, playback_url, release_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id, 
            data.title, 
            data.artist, 
            data.album || 'YouTube Single', 
            data.artwork_url || '', 
            data.duration || 180, 
            data.source || 'youtube', 
            data.source_id || data.id?.replace('yt_', ''), 
            '', 
            data.release_date || ''
          ]
        );
      }
    }

    await logApiUsage(type, 'manual_pinned_cache', id);
    res.json({ message: 'Cached for 7 days successfully', expires_at: expiresAt });
  } catch (err) {
    console.error('Manual cache error:', err);
    res.status(500).json({ error: 'Failed to manual cache item' });
  }
}

// 2. Remove cache item (individual or all)
export async function removeCacheItem(req, res) {
  const { id, clearAll } = req.query;

  try {
    if (clearAll === 'true') {
      await query('DELETE FROM youtube_cache');
      res.json({ message: 'All cached YouTube metadata cleared successfully' });
    } else if (id) {
      await query('DELETE FROM youtube_cache WHERE id = $1', [id]);
      res.json({ message: 'Cached item removed successfully' });
    } else {
      res.status(400).json({ error: 'ID or clearAll parameter is required' });
    }
  } catch (err) {
    console.error('Remove cache error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 3. Force refresh cache item now
export async function refreshCacheItem(req, res) {
  const { id, type } = req.body;
  if (!id || !type) {
    return res.status(400).json({ error: 'ID and type are required' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'YouTube API key not configured on server' });
  }

  try {
    const nowStr = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    if (type === 'song') {
      // Re-fetch video details from YouTube
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${id.replace('yt_', '')}&key=${apiKey}`;
      const detailsRes = await fetch(detailsUrl);
      if (!detailsRes.ok) throw new Error('Failed to retrieve video details');
      
      const detailsData = await detailsRes.json();
      const item = detailsData.items?.[0];
      if (!item) return res.status(404).json({ error: 'Video not found on YouTube' });

      const durationSec = parseISO8601Duration(item.contentDetails?.duration || '');
      const rawTitle = item.snippet?.title || 'Unknown Title';
      const channelTitle = item.snippet?.channelTitle || 'Unknown Channel';
      const cleanDetails = cleanTitleDetails(rawTitle, channelTitle);

      const songData = {
        id,
        title: cleanDetails.title,
        artist: cleanDetails.artist,
        album: cleanDetails.album,
        artwork_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
        duration: durationSec || 180,
        source: 'youtube',
        source_id: item.id,
        playback_url: '',
        release_date: item.snippet?.publishedAt?.substring(0, 4) || ''
      };

      // Update cache
      await query(
        `UPDATE youtube_cache SET data = $1, expires_at = $2, last_accessed_at = $3 WHERE id = $4`,
        [JSON.stringify(songData), expiresAt, nowStr, id]
      );

      // Update songs table
      await query(
        `UPDATE songs SET title = $1, artist = $2, album = $3, artwork_url = $4, duration = $5, release_date = $6 WHERE id = $7`,
        [songData.title, songData.artist, songData.album, songData.artwork_url, songData.duration, songData.release_date, id]
      );
      
      await logApiUsage('song_refresh', 'miss', id);
      return res.json({ message: 'Song cache refreshed successfully', expires_at: expiresAt, data: songData });
    } else if (type === 'search') {
      const q = id.replace('search_', '');
      const songs = await fetchYouTubeSearch(q, apiKey);
      await query(
        `UPDATE youtube_cache SET data = $1, expires_at = $2, last_accessed_at = $3 WHERE id = $4`,
        [JSON.stringify(songs), expiresAt, nowStr, id]
      );
      await logApiUsage('search_refresh', 'miss', q);
      return res.json({ message: 'Search cache refreshed successfully', expires_at: expiresAt, data: songs });
    }

    res.status(400).json({ error: 'Unsupported cache refresh type' });
  } catch (err) {
    console.error('Refresh cache item error:', err);
    res.status(500).json({ error: 'Failed to refresh cache item' });
  }
}

// 4. Retrieve Cache statistics (Active cache, hit rates, space saved)
export async function getCacheStats(req, res) {
  try {
    const totalCached = await query('SELECT COUNT(*) as count FROM youtube_cache');
    const activeCached = await query('SELECT COUNT(*) as count FROM youtube_cache WHERE expires_at > CURRENT_TIMESTAMP');
    const expiringSoon = await query('SELECT COUNT(*) as count FROM youtube_cache WHERE expires_at > CURRENT_TIMESTAMP AND expires_at < datetime(CURRENT_TIMESTAMP, "+24 hours")');
    
    // Retrieve hits & misses from logs
    const totalLogs = await query('SELECT COUNT(*) as count FROM api_usage_logs');
    const hits = await query('SELECT COUNT(*) as count FROM api_usage_logs WHERE status = "hit" OR status = "stale_hit"');
    const misses = await query('SELECT COUNT(*) as count FROM api_usage_logs WHERE status = "miss" OR status = "manual_pinned_cache"');

    const totalCount = totalLogs.rows[0].count || 0;
    const hitCount = hits.rows[0].count || 0;
    const hitRate = totalCount > 0 ? Math.round((hitCount / totalCount) * 100) : 100;

    // Estimate storage usage by parsing character lengths
    const sizeResult = await query('SELECT SUM(length(data)) as total_chars FROM youtube_cache');
    const totalChars = sizeResult.rows[0].total_chars || 0;
    const totalMB = Math.round((totalChars / (1024 * 1024)) * 100) / 100;

    res.json({
      totalCached: totalCached.rows[0].count || 0,
      activeCached: activeCached.rows[0].count || 0,
      expiringSoon: expiringSoon.rows[0].count || 0,
      hitCount,
      missCount: misses.rows[0].count || 0,
      hitRate,
      cacheSizeMB: totalMB || 0.05
    });
  } catch (err) {
    console.error('Get cache statistics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 5. List cached resources
export async function getCacheList(req, res) {
  try {
    const result = await query(
      `SELECT id, cache_key, cache_type, query, expires_at, created_at, is_pinned, access_count, data 
       FROM youtube_cache 
       ORDER BY is_pinned DESC, expires_at ASC`
    );
    
    const items = result.rows.map(item => {
      let parsedData = {};
      try {
        parsedData = JSON.parse(item.data);
      } catch {}

      let name = item.query || item.cache_key;
      let artist = 'YouTube API Request';
      let songCount = 0;

      if (item.cache_type === 'song') {
        name = parsedData.title || name;
        artist = parsedData.artist || artist;
      } else if (item.cache_type === 'search') {
        name = `Search: "${item.query}"`;
        songCount = Array.isArray(parsedData) ? parsedData.length : 0;
      } else if (item.cache_type === 'playlist') {
        name = parsedData.title || name;
        songCount = parsedData.songs ? parsedData.songs.length : 0;
      }

      return {
        id: item.id,
        key: item.cache_key,
        type: item.cache_type,
        name,
        artist,
        songCount,
        expiresAt: item.expires_at,
        createdAt: item.created_at,
        isPinned: item.is_pinned === 1 || item.is_pinned === true,
        accessCount: item.access_count || 0
      };
    });

    res.json({ items });
  } catch (err) {
    console.error('Get cache list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Auto clean non-pinned expired entries every 6 hours
setInterval(async () => {
  try {
    const nowStr = new Date().toISOString();
    const res = await query('DELETE FROM youtube_cache WHERE expires_at < $1 AND is_pinned = 0', [nowStr]);
    if (res.rowCount > 0) {
      console.log(`Cleaned up ${res.rowCount} expired, non-pinned YouTube cache records.`);
    }
  } catch (err) {
    console.error('Failed to run automatic expired cache cleanup:', err);
  }
}, 6 * 60 * 60 * 1000);
