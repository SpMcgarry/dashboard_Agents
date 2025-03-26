import express from 'express';
import { AIService } from '../services/aiService';

const router = express.Router();

router.post('/test-ai', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await AIService.generateResponse(prompt);
    res.json({ response });
  } catch (error) {
    console.error('Error in test-ai route:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

export default router; 