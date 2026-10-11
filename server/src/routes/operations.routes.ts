import { Router } from 'express';
import { PERMISSIONS } from '../constants/permissions';
import * as ops from '../controllers/operations.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAnyPermission, requirePermission } from '../middleware/requirePermission';
import { validate } from '../middleware/validate';
import { listQuerySchema } from '../utils/pagination';
import {
  idParamSchema,
  leadsQuerySchema,
  paymentSchema,
  rejectSchema,
} from '../validators/operations.schema';

const byId = validate('params', idParamSchema);
const listQuery = validate('query', listQuerySchema);

/** Each module router checks its own permission; hiding the menu in the UI is not enough. */
export const salesRoutes = Router()
  .use(authenticate, requirePermission(PERMISSIONS.LEAD_READ))
  .get('/leads', validate('query', leadsQuerySchema), ops.getLeads);

export const sanctionRoutes = Router()
  .use(authenticate, requirePermission(PERMISSIONS.LOAN_SANCTION))
  .get('/loans', listQuery, ops.getApplied)
  .post('/loans/:id/approve', byId, ops.approve)
  .post('/loans/:id/reject', byId, validate('body', rejectSchema), ops.reject);

export const disbursementRoutes = Router()
  .use(authenticate, requirePermission(PERMISSIONS.LOAN_DISBURSE))
  .get('/loans', listQuery, ops.getSanctioned)
  .post('/loans/:id/disburse', byId, ops.disburse);

export const collectionRoutes = Router()
  .use(authenticate, requirePermission(PERMISSIONS.PAYMENT_RECORD))
  .get('/loans', listQuery, ops.getDisbursed)
  .get('/loans/:id/payments', byId, ops.getPayments)
  .post('/loans/:id/payments', byId, validate('body', paymentSchema), ops.recordPayment);

/** Loan detail: staff with the permission, or the owning borrower (checked in the service). */
export const loanRoutes = Router()
  .use(authenticate)
  .get(
    '/:id',
    requireAnyPermission(PERMISSIONS.LOAN_READ, PERMISSIONS.APPLICATION_MANAGE_OWN),
    byId,
    ops.getLoan,
  )
  .get(
    '/:id/salary-slip',
    requireAnyPermission(PERMISSIONS.LOAN_DOCUMENT_READ, PERMISSIONS.APPLICATION_MANAGE_OWN),
    byId,
    ops.getSalarySlip,
  );

/** Overview charts for any staff member who can read loans. */
export const statsRoutes = Router()
  .use(authenticate, requirePermission(PERMISSIONS.LOAN_READ))
  .get('/overview', ops.getOverview);
