import express from 'express';
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistDetails,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist
} from '../controllers/playlistController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, createPlaylist);
router.get('/', authenticateToken, getUserPlaylists);
router.get('/:id', authenticateToken, getPlaylistDetails);
router.put('/:id', authenticateToken, updatePlaylist);
router.delete('/:id', authenticateToken, deletePlaylist);
router.post('/:id/songs', authenticateToken, addSongToPlaylist);
router.delete('/:id/songs/:songId', authenticateToken, removeSongFromPlaylist);

export default router;
