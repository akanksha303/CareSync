import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getAuthUrl, handleCallback } from '../services/calendar';
import { prisma } from '../config/prisma';

const router = Router();

router.get('/auth', authenticate, (req: Request, res: Response) => {
  const url = getAuthUrl(req.user!.userId, req.user!.role);
  res.json({ url });
});

router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    if (!code) { res.status(400).json({ error: 'Missing code' }); return; }
    const { userId } = JSON.parse(state) as { userId: string; role: string };
    const tokens = await handleCallback(code);
    await prisma.user.update({
      where: { id: userId },
      data: {
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
      },
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/calendar/connected`);
  } catch (err) {
    console.error('Calendar callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/calendar/error`);
  }
});

export default router;
