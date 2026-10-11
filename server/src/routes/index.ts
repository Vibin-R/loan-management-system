import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';

/**
 * All API routes, mounted under /api/v1 in app.ts.
 * Feature routers (borrower, sales, sanction, disbursement, collection) are added here
 * as each phase is built.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

export default router;
