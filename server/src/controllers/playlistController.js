import { query } from '../config/db.js';

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export async function createPlaylist(req, res) {
  const userId = req.user.id;
  const { name, description, artwork, is_public } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Playlist name is required' });
  }

  const id = 'pl_' + generateId();
  // Default artwork if none is provided
  const artworkUrl = artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&h=400&q=80';

  try {
    await query(
      'INSERT INTO playlists (id, name, description, artwork, owner_id, is_public) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, name, description || '', artworkUrl, userId, is_public ? 1 : 0]
    );

    const playlist = await query('SELECT * FROM playlists WHERE id = $1', [id]);
    res.status(201).json({ message: 'Playlist created successfully', playlist: playlist.rows[0] });
  } catch (err) {
    console.error('Create playlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserPlaylists(req, res) {
  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT p.*, COUNT(ps.song_id) as song_count 
       FROM playlists p
       LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
       WHERE p.owner_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [userId]
    );
    res.json({ playlists: result.rows });
  } catch (err) {
    console.error('Get user playlists error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPlaylistDetails(req, res) {
  const { id } = req.params;

  try {
    const playlistResult = await query('SELECT * FROM playlists WHERE id = $1', [id]);
    if (playlistResult.rowCount === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const playlist = playlistResult.rows[0];

    // Fetch songs in this playlist
    const songsResult = await query(
      `SELECT s.*, ps.added_at 
       FROM songs s
       JOIN playlist_songs ps ON s.id = ps.song_id
       WHERE ps.playlist_id = $1
       ORDER BY ps.added_at ASC`,
      [id]
    );

    res.json({
      playlist,
      songs: songsResult.rows
    });
  } catch (err) {
    console.error('Get playlist details error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updatePlaylist(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, description, artwork, is_public } = req.body;

  try {
    const check = await query('SELECT owner_id FROM playlists WHERE id = $1', [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (check.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to modify this playlist' });
    }

    await query(
      `UPDATE playlists 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           artwork = COALESCE($3, artwork),
           is_public = COALESCE($4, is_public)
       WHERE id = $5`,
      [name, description, artwork, is_public !== undefined ? (is_public ? 1 : 0) : null, id]
    );

    const updated = await query('SELECT * FROM playlists WHERE id = $1', [id]);
    res.json({ message: 'Playlist updated successfully', playlist: updated.rows[0] });
  } catch (err) {
    console.error('Update playlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deletePlaylist(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const check = await query('SELECT owner_id FROM playlists WHERE id = $1', [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (check.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this playlist' });
    }

    await query('DELETE FROM playlist_songs WHERE playlist_id = $1', [id]);
    await query('DELETE FROM playlists WHERE id = $1', [id]);

    res.json({ message: 'Playlist deleted successfully' });
  } catch (err) {
    console.error('Delete playlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addSongToPlaylist(req, res) {
  const userId = req.user.id;
  const { id } = req.params; // playlist ID
  const { songId } = req.body;

  if (!songId) {
    return res.status(400).json({ error: 'Song ID is required' });
  }

  try {
    const check = await query('SELECT owner_id FROM playlists WHERE id = $1', [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (check.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to add songs to this playlist' });
    }

    // Insert if not already in playlist
    const songCheck = await query('SELECT playlist_id FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2', [id, songId]);
    if (songCheck.rowCount === 0) {
      await query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2)', [id, songId]);
    }

    res.json({ message: 'Song added to playlist successfully' });
  } catch (err) {
    console.error('Add song to playlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeSongFromPlaylist(req, res) {
  const userId = req.user.id;
  const { id, songId } = req.params;

  try {
    const check = await query('SELECT owner_id FROM playlists WHERE id = $1', [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (check.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to remove songs from this playlist' });
    }

    await query('DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2', [id, songId]);
    res.json({ message: 'Song removed from playlist successfully' });
  } catch (err) {
    console.error('Remove song from playlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
