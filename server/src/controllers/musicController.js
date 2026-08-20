import { query } from '../config/db.js';

// Parse ISO 8601 duration format (e.g. PT3M45S) into seconds
function parseISO8601Duration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// Search YouTube and format as song schema
export async function searchSongs(req, res) {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'YouTube API key not configured on server' });
  }

  try {
    console.log(`Searching YouTube for: "${q}"`);
    // 1. Query YouTube API search to find videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q + ' music')}&type=video&maxResults=20&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    
    if (!searchRes.ok) {
      const err = await searchRes.json();
      console.error('YouTube API Error response:', err);
      return res.status(searchRes.status).json({ error: err.error?.message || 'YouTube search service failed' });
    }

    const searchData = await searchRes.json();
    const items = searchData.items || [];
    if (items.length === 0) {
      return res.json({ songs: [] });
    }

    const videoIds = items.map(item => item.id.videoId).filter(Boolean);

    // 2. Fetch video details to parse exact playback durations
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds.join(',')}&key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl);
    
    if (!detailsRes.ok) {
      return res.status(detailsRes.status).json({ error: 'Failed to retrieve detailed metadata' });
    }

    const detailsData = await detailsRes.json();
    const detailsItems = detailsData.items || [];

    const songs = detailsItems.map(item => {
      const durationSec = parseISO8601Duration(item.contentDetails?.duration || '');
      // Remove noise from title and clean up artist names
      const rawTitle = item.snippet?.title || 'Unknown Title';
      const cleanTitle = rawTitle
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\(Official (Video|Audio|Music Video)\)/gi, '')
        .replace(/\[Official (Video|Audio|Music Video)\]/gi, '')
        .trim();

      return {
        id: `yt_${item.id}`,
        title: cleanTitle,
        artist: item.snippet?.channelTitle?.replace(/ - Topic$/i, '') || 'Unknown Artist',
        album: 'YouTube Single',
        artwork_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
        duration: durationSec || 180,
        source: 'youtube',
        source_id: item.id,
        playback_url: '', // Played via standard YouTube player
        release_date: item.snippet?.publishedAt?.substring(0, 4) || ''
      };
    });

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
