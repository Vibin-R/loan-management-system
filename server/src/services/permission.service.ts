import type { Permission } from '../constants/permissions';
import { UserModel } from '../models/User';
import { AppError } from '../utils/AppError';

/** What the server knows about the caller once they are authenticated. */
export interface UserAccess {
  id: string;
  roles: string[];
  permissions: ReadonlySet<Permission>;
  permVersion: number;
}

interface CacheEntry {
  access: UserAccess;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * In-memory cache of each user's resolved permissions, so access checks almost never hit the
 * database. With several server instances, move this to Redis and broadcast invalidations
 * (docs/DESIGN.md §7). The TTL bounds staleness either way.
 */
const cache = new Map<string, CacheEntry>();

interface PopulatedUser {
  isActive: boolean;
  permVersion: number;
  roles: { name: string; permissions: Permission[] }[];
}

async function loadUserAccess(userId: string): Promise<UserAccess> {
  const user = await UserModel.findById(userId)
    .select('roles isActive permVersion')
    .populate('roles', 'name permissions')
    .lean<PopulatedUser>();

  if (!user || !user.isActive) {
    throw AppError.unauthenticated('Your session is no longer valid. Please log in again.');
  }

  return {
    id: userId,
    roles: user.roles.map((role) => role.name),
    // A user's permissions are the union of all their roles' permissions.
    permissions: new Set(user.roles.flatMap((role) => role.permissions)),
    permVersion: user.permVersion,
  };
}

export async function getUserAccess(userId: string): Promise<UserAccess> {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.access;

  const access = await loadUserAccess(userId);
  cache.set(userId, { access, expiresAt: Date.now() + CACHE_TTL_MS });
  return access;
}

/** Call after changing a user's roles, a role's permissions, or deactivating a user. */
export function invalidateUserAccess(userIds: string[]): void {
  userIds.forEach((id) => cache.delete(id));
}

export const hasPermission = (access: UserAccess, permission: Permission): boolean =>
  access.permissions.has(permission);
