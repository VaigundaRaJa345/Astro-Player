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
  searchSongs,
  manualCacheItem,
  removeCacheItem,
  refreshCacheItem,
  getCacheStats,
  getCacheList,
  getSearchSuggestions
} from '../controllers/musicController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Search, Seeded tracks & YouTube API Caching
router.get('/search', searchSongs);
router.get('/suggestions', getSearchSuggestions);
router.get('/featured', getFeatured);
router.post('/sync', authenticateToken, syncSong);

// Cache Management & API Metrics
router.post('/cache-manual', authenticateToken, manualCacheItem);
router.delete('/cache', authenticateToken, removeCacheItem);
router.post('/cache-refresh', authenticateToken, refreshCacheItem);
router.get('/cache-stats', authenticateToken, getCacheStats);
router.get('/cache-list', authenticateToken, getCacheList);

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
