import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { authRateLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { loginSchema, signupSchema } from '../validators/auth.schema';

const router = Router();

router.post('/signup', authRateLimiter, validate('body', signupSchema), authController.signup);
router.post('/login', authRateLimiter, validate('body', loginSchema), authController.login);
router.get('/me', authenticate, authController.me);

export default router;
