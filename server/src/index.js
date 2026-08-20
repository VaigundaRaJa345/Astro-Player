import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './config/db.js';
import authRoutes from './routes/auth.js';
import songsRoutes from './routes/songs.js';
import playlistRoutes from './routes/playlists.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite development server
app.use(cors({
  origin: '*', // For demo purposes, allow all connections
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songsRoutes);
app.use('/api/playlists', playlistRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Astro Player API. Your Sound. Your Universe.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// Start database and server
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Astro Player Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database or start server:', err);
    process.exit(1);
  }
}

startServer();
