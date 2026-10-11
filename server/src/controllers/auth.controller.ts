import type { Request, Response } from 'express';
import { getAuthUser } from '../middleware/authenticate';
import * as authService from '../services/auth.service';
import type { LoginInput, SignupInput } from '../validators/auth.schema';

export async function signup(_req: Request, res: Response) {
  const result = await authService.signup(res.locals.body as SignupInput);
  res.status(201).json({ data: result });
}

export async function login(_req: Request, res: Response) {
  const result = await authService.login(res.locals.body as LoginInput);
  res.json({ data: result });
}

export async function me(req: Request, res: Response) {
  const result = await authService.getCurrentUser(getAuthUser(req));
  res.json({ data: result });
}
