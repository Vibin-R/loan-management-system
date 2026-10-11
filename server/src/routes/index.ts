import { Router } from 'express';
import healthRoutes from './health.routes';

/**
 * All API routes, mounted under /api/v1 in app.ts.
 * Feature routers (auth, borrower, sales, sanction, disbursement, collection) are added here
 * as each phase is built.
 */
const router = Router();

router.use('/health', healthRoutes);

export default router;
