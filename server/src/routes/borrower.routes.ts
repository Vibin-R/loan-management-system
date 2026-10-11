import { Router } from 'express';
import { PERMISSIONS } from '../constants/permissions';
import * as borrowerController from '../controllers/borrower.controller';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';
import { singleFileUpload } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { applySchema, profileSchema } from '../validators/borrower.schema';

/** Borrower portal. Every route acts only on the caller's own data (req.user.id). */
const router = Router();

router.use(authenticate, requirePermission(PERMISSIONS.APPLICATION_MANAGE_OWN));

router.get('/application', borrowerController.getApplication);
router.put('/profile', validate('body', profileSchema), borrowerController.saveProfile);
router.post('/salary-slip', singleFileUpload('file'), borrowerController.uploadSalarySlip);
router.post('/loans', validate('body', applySchema), borrowerController.applyForLoan);
router.get('/loans', borrowerController.listMyLoans);

export default router;
