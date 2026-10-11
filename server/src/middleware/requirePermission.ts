import type { RequestHandler } from 'express';
import type { Permission } from '../constants/permissions';
import { AppError } from '../utils/AppError';
import { getAuthUser } from './authenticate';

/** Allows the request only if the caller has **every** listed permission. Otherwise 403. */
export const requirePermission =
  (...required: Permission[]): RequestHandler =>
  (req, _res, next) => {
    const { permissions } = getAuthUser(req);
    if (!required.every((p) => permissions.has(p))) throw AppError.forbidden();
    next();
  };

/** Allows the request if the caller has **at least one** listed permission. Otherwise 403. */
export const requireAnyPermission =
  (...allowed: Permission[]): RequestHandler =>
  (req, _res, next) => {
    const { permissions } = getAuthUser(req);
    if (!allowed.some((p) => permissions.has(p))) throw AppError.forbidden();
    next();
  };
