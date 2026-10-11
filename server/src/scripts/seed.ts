/**
 * Creates the permission catalogue, the default roles and one user per role.
 * Idempotent: every item is upserted by its unique key, so it is safe to run again.
 * Seed passwords are reset on every run so the documented credentials always work.
 *
 * Usage: npm run seed
 */
import { connectDatabase, disconnectDatabase } from '../config/db';
import { APPLICATION_STAGES } from '../constants/applicationStage';
import { ALL_PERMISSIONS, PERMISSION_DESCRIPTIONS } from '../constants/permissions';
import { DEFAULT_ROLES, ROLE_NAMES } from '../constants/roles';
import { PermissionModel } from '../models/Permission';
import { RoleModel } from '../models/Role';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';
import { hashPassword } from '../utils/password';
import { SEED_USERS } from './seedData';

async function syncIndexes(): Promise<void> {
  await Promise.all([
    PermissionModel.syncIndexes(),
    RoleModel.syncIndexes(),
    UserModel.syncIndexes(),
  ]);
}

async function seedPermissions(): Promise<void> {
  await PermissionModel.bulkWrite(
    ALL_PERMISSIONS.map((key) => {
      const [resource = key, ...rest] = key.split(':');
      return {
        updateOne: {
          filter: { key },
          update: {
            $set: { resource, action: rest.join(':'), description: PERMISSION_DESCRIPTIONS[key] },
          },
          upsert: true,
        },
      };
    }),
  );

  // Remove permissions that no longer exist in code, and strip them from every role.
  const removed = await PermissionModel.find({ key: { $nin: ALL_PERMISSIONS } }).distinct('key');
  if (removed.length > 0) {
    await RoleModel.updateMany({}, { $pull: { permissions: { $in: removed } } });
    await PermissionModel.deleteMany({ key: { $in: removed } });
  }
  logger.info(`Permissions: ${ALL_PERMISSIONS.length} upserted, ${removed.length} removed`);
}

async function seedRoles(): Promise<Map<string, string>> {
  const roleIds = new Map<string, string>();
  for (const role of DEFAULT_ROLES) {
    const doc = await RoleModel.findOneAndUpdate(
      { name: role.name },
      {
        $set: { description: role.description, permissions: role.permissions, isSystem: true },
        $inc: { version: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    roleIds.set(role.name, doc.id);
  }
  // Seeded roles may have changed, so refresh the cached access of everyone holding them.
  await UserModel.updateMany({}, { $inc: { permVersion: 1 } });
  logger.info(`Roles: ${DEFAULT_ROLES.length} upserted`);
  return roleIds;
}

async function seedUsers(roleIds: Map<string, string>): Promise<void> {
  for (const seedUser of SEED_USERS) {
    const roleId = roleIds.get(seedUser.role);
    if (!roleId) throw new Error(`Role ${seedUser.role} was not seeded`);

    await UserModel.updateOne(
      { email: seedUser.email },
      {
        $set: {
          name: seedUser.name,
          passwordHash: await hashPassword(seedUser.password),
          roles: [roleId],
          isActive: true,
        },
        $setOnInsert: {
          applicationStage:
            seedUser.role === ROLE_NAMES.BORROWER ? APPLICATION_STAGES.REGISTERED : null,
        },
      },
      { upsert: true },
    );
  }
  logger.info(`Users: ${SEED_USERS.length} upserted`);
}

async function main(): Promise<void> {
  await connectDatabase();
  try {
    await syncIndexes();
    await seedPermissions();
    const roleIds = await seedRoles();
    await seedUsers(roleIds);
    logger.info('Seed complete');
  } finally {
    await disconnectDatabase();
  }
}

main().catch((err) => {
  logger.fatal({ err }, 'Seed failed');
  process.exit(1);
});
