import { Router } from 'express';
import { isDatabaseReady } from '../config/db';

const router = Router();

/** Liveness and readiness check for load balancers and uptime monitors. */
router.get('/', (_req, res) => {
  const dbUp = isDatabaseReady();
  res.status(dbUp ? 200 : 503).json({
    data: { status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'up' : 'down', uptime: process.uptime() },
  });
});

export default router;
