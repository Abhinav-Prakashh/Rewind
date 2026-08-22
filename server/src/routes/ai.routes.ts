import { Router, Request, Response } from 'express';
import { AIMemoryService } from '../services/ai.service.js';

const router = Router();

// POST /api/repos/:repoId/ai/query — Query project memory
router.post('/repos/:repoId/ai/query', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query string is required' });
      return;
    }

    const result = await AIMemoryService.queryMemory(repoId as string, query);
    res.json(result);

  } catch (error) {
    console.error('Error in AI memory query:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to query memory layer',
    });
  }
});

// GET /api/repos/:repoId/ai/suggestions — Get contextual prompt suggestions
router.get('/repos/:repoId/ai/suggestions', async (_req: Request, res: Response) => {
  try {
    const suggestions = [
      'What was I working on recently?',
      'What changed while I was away?',
      'Which files are related to authentication or sessions?',
      'What was the goal of the latest commit?',
    ];
    res.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;
