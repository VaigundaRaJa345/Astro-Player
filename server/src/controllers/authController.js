import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'astro_super_secret_universe_key_2026';

export async function register(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    // Check if user already exists
    const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rowCount > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const insertUser = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, passwordHash]
    );
    
    let userId;
    let registeredUser = {};
    
    if (insertUser.rows && insertUser.rows.length > 0) {
      userId = insertUser.rows[0].id;
      registeredUser = { id: userId, username: insertUser.rows[0].username, email: insertUser.rows[0].email };
    } else {
      // In SQLite, RETURNING is not always fully supported on older versions, so fetch last inserted id:
      const lastIdCheck = await query('SELECT id, username, email FROM users WHERE email = $1', [email]);
      userId = lastIdCheck.rows[0].id;
      registeredUser = lastIdCheck.rows[0];
    }

    // Insert default user settings
    await query(
      'INSERT INTO user_settings (user_id, playback_crossfade, wifi_only, download_quality, theme_color) VALUES ($1, $2, $3, $4, $5)',
      [userId, 0, 0, 'High', 'blue']
    );

    // Generate JWT
    const token = jwt.sign(
      { id: userId, username: registeredUser.username, email: registeredUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: registeredUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    // Fetch user details
    const userResult = await query('SELECT id, username, email, created_at FROM users WHERE id = $1', [userId]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Fetch user settings
    const settingsResult = await query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
    const settings = settingsResult.rowCount > 0 ? settingsResult.rows[0] : {};

    // Fetch stats
    const likedCount = await query('SELECT COUNT(*) as count FROM liked_songs WHERE user_id = $1', [userId]);
    const playlistsCount = await query('SELECT COUNT(*) as count FROM playlists WHERE owner_id = $1', [userId]);
    const historyCount = await query('SELECT COUNT(*) as count FROM listening_history WHERE user_id = $1', [userId]);
    const downloadsCount = await query('SELECT COUNT(*) as count FROM downloads WHERE user_id = $1', [userId]);

    res.json({
      user,
      settings,
      stats: {
        likedSongs: parseInt(likedCount.rows[0]?.count || 0),
        playlists: parseInt(playlistsCount.rows[0]?.count || 0),
        songsPlayed: parseInt(historyCount.rows[0]?.count || 0),
        minutesListened: parseInt(historyCount.rows[0]?.count || 0) * 3, // mock 3 minutes per song
        downloads: parseInt(downloadsCount.rows[0]?.count || 0)
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateSettings(req, res) {
  const userId = req.user.id;
  const { playback_crossfade, wifi_only, download_quality, theme_color } = req.body;

  try {
    // Check if settings exist
    const settingsCheck = await query('SELECT user_id FROM user_settings WHERE user_id = $1', [userId]);
    
    if (settingsCheck.rowCount === 0) {
      await query(
        'INSERT INTO user_settings (user_id, playback_crossfade, wifi_only, download_quality, theme_color) VALUES ($1, $2, $3, $4, $5)',
        [userId, playback_crossfade || 0, wifi_only ? 1 : 0, download_quality || 'High', theme_color || 'blue']
      );
    } else {
      await query(
        `UPDATE user_settings 
         SET playback_crossfade = COALESCE($1, playback_crossfade),
             wifi_only = COALESCE($2, wifi_only),
             download_quality = COALESCE($3, download_quality),
             theme_color = COALESCE($4, theme_color)
         WHERE user_id = $5`,
        [playback_crossfade, wifi_only !== undefined ? (wifi_only ? 1 : 0) : null, download_quality, theme_color, userId]
      );
    }

    const updated = await query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
    res.json({ message: 'Settings updated successfully', settings: updated.rows[0] });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
