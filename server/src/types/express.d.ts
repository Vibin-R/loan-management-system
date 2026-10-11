import type { UserAccess } from '../services/permission.service';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `authenticate` middleware. Read it through `getAuthUser(req)`. */
      user?: UserAccess;
    }
  }
}

export {};
