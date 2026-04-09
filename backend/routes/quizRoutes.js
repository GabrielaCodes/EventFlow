import express from 'express';
import { suggestEventTheme } from '../controllers/quizController.js';

const router = express.Router();

// Route: POST /api/quiz/ai-suggest-theme
router.post('/ai-suggest-theme', suggestEventTheme);

export default router;