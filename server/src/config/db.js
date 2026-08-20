import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dbType = 'sqlite'; // 'postgres' or 'sqlite'
let pgPool = null;
let sqliteDb = null;

// Initialize connection
export async function initDb() {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    try {
      console.log('Attempting connection to PostgreSQL...');
      pgPool = new pg.Pool({
        connectionString: dbUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      // Test the connection
      await pgPool.query('SELECT NOW()');
      dbType = 'postgres';
      console.log('Successfully connected to PostgreSQL database.');
    } catch (err) {
      console.error('PostgreSQL connection failed. Falling back to SQLite:', err.message);
      setupSQLite();
    }
  } else {
    console.log('No DATABASE_URL found. Initializing SQLite...');
    setupSQLite();
  }

  await createTables();
}

function setupSQLite() {
  dbType = 'sqlite';
  const dbPath = path.resolve(__dirname, '../../astro_player.db');
  console.log(`Using SQLite database at: ${dbPath}`);
  sqliteDb = new sqlite3.Database(dbPath);
}

// SQL helper to run queries with arguments
export function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (dbType === 'postgres') {
      pgPool.query(sql, params)
        .then(res => resolve({ rows: res.rows, rowCount: res.rowCount }))
        .catch(err => reject(err));
    } else {
      // Convert Postgres placeholders ($1, $2...) to SQLite placeholders (?)
      const sqliteSql = sql.replace(/\$\d+/g, '?');
      
      // Select the correct run type based on the query keyword
      const isSelect = sqliteSql.trim().toUpperCase().startsWith('SELECT');
      
      if (isSelect) {
        sqliteDb.all(sqliteSql, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows, rowCount: rows.length });
        });
      } else {
        sqliteDb.run(sqliteSql, params, function(err) {
          if (err) return reject(err);
          resolve({ rows: [], rowCount: this.changes });
        });
      }
    }
  });
}

// Create database schemas and initial mock metadata for Astro Originals
async function createTables() {
  // SQLite and Postgres types differ slightly:
  // Postgres: SERIAL, SQLite: INTEGER PRIMARY KEY AUTOINCREMENT
  // Postgres: VARCHAR, SQLite: TEXT
  // Postgres: BOOLEAN, SQLite: BOOLEAN/INTEGER
  const isPostgres = dbType === 'postgres';
  const serialType = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id ${serialType},
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT,
      artwork_url TEXT,
      duration INTEGER NOT NULL,
      source TEXT NOT NULL,
      source_id TEXT NOT NULL,
      playback_url TEXT,
      release_date TEXT
    )`,
    
    `CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      artwork TEXT,
      owner_id INTEGER,
      is_public BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS playlist_songs (
      playlist_id TEXT,
      song_id TEXT,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (playlist_id, song_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS liked_songs (
      user_id INTEGER,
      song_id TEXT,
      liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, song_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS listening_history (
      user_id INTEGER,
      song_id TEXT,
      played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS downloads (
      user_id INTEGER,
      song_id TEXT,
      download_status TEXT DEFAULT 'downloaded',
      quality TEXT DEFAULT 'High',
      downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, song_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS followed_artists (
      user_id INTEGER,
      artist_id TEXT,
      followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, artist_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      playback_crossfade INTEGER DEFAULT 0,
      wifi_only BOOLEAN DEFAULT 0,
      download_quality TEXT DEFAULT 'High',
      theme_color TEXT DEFAULT 'blue'
    )`
  ];

  console.log('Checking database tables...');
  for (const q of tables) {
    await query(q);
  }
  console.log('Database tables successfully verified/created.');

  // Create indexes for optimization
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_history_user ON listening_history(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist ON playlist_songs(playlist_id)',
    'CREATE INDEX IF NOT EXISTS idx_liked_songs_user ON liked_songs(user_id)'
  ];

  for (const idxQ of indexes) {
    await query(idxQ);
  }
  console.log('Database indexes verified/created.');

  // Seed default tracks (Astro Originals) that are fully eligible for high-quality downloading
  await seedDefaultTracks();
}

async function seedDefaultTracks() {
  const defaultTracks = [
    {
      id: 'astro_original_stellar',
      title: 'Stellar Drift',
      artist: 'Astro Project',
      album: 'Cosmic Horizons',
      artwork_url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=400&h=400&q=80',
      duration: 165,
      source: 'astro',
      source_id: 'stellar_drift',
      // High-quality audio files from standard, reliable creative commons streams
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
  ];

  for (const track of defaultTracks) {
    const check = await query('SELECT id FROM songs WHERE id = $1', [track.id]);
    if (check.rowCount === 0) {
      await query(
        `INSERT INTO songs (id, title, artist, album, artwork_url, duration, source, source_id, playback_url, release_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [track.id, track.title, track.artist, track.album, track.artwork_url, track.duration, track.source, track.source_id, track.playback_url, track.release_date]
      );
    }
  }
  console.log('Astro Original tracks checked and seeded.');
}
