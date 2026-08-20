import express from 'express';
import {
  syncSong,
  getFeatured,
  likeSong,
  unlikeSong,
  getLikedSongs,
  addHistory,
  getHistory,
  clearHistory,
  addDownload,
  removeDownload,
  getDownloads,
  clearDownloads,
  searchSongs
} from '../controllers/musicController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Search & Seeded tracks
router.get('/search', authenticateToken, searchSongs);
router.get('/featured', authenticateToken, getFeatured);
router.post('/sync', authenticateToken, syncSong);

// Likes
router.post('/like', authenticateToken, likeSong);
router.delete('/like/:songId', authenticateToken, unlikeSong);
router.get('/likes', authenticateToken, getLikedSongs);

// History
router.post('/history', authenticateToken, addHistory);
router.get('/history', authenticateToken, getHistory);
router.delete('/history', authenticateToken, clearHistory);

// Downloads
router.post('/download', authenticateToken, addDownload);
router.delete('/download/:songId', authenticateToken, removeDownload);
router.get('/downloads', authenticateToken, getDownloads);
router.delete('/downloads', authenticateToken, clearDownloads);

export default router;
