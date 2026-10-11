import { Router } from 'express';
import authRoutes from './auth.routes';
import borrowerRoutes from './borrower.routes';
import healthRoutes from './health.routes';
import {
  collectionRoutes,
  disbursementRoutes,
  loanRoutes,
  salesRoutes,
  sanctionRoutes,
} from './operations.routes';

/** All API routes, mounted under /api/v1 in app.ts. */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/borrower', borrowerRoutes);
router.use('/sales', salesRoutes);
router.use('/sanction', sanctionRoutes);
router.use('/disbursement', disbursementRoutes);
router.use('/collection', collectionRoutes);
router.use('/loans', loanRoutes);

export default router;
