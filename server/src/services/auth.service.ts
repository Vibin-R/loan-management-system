import { APPLICATION_STAGES } from '../constants/applicationStage';
import { ROLE_NAMES } from '../constants/roles';
import { RoleModel } from '../models/Role';
import { UserModel } from '../models/User';
import { AppError } from '../utils/AppError';
import { signAccessToken } from '../utils/jwt';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from '../utils/password';
import type { LoginInput, SignupInput } from '../validators/auth.schema';
import { getUserAccess, type UserAccess } from './permission.service';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface AuthResult {
  user: PublicUser;
  permissions: string[];
  token: string;
}

async function buildAuthResult(userId: string, name: string, email: string): Promise<AuthResult> {
  const access = await getUserAccess(userId);
  return {
    user: { id: userId, name, email, roles: access.roles },
    permissions: [...access.permissions],
    token: signAccessToken(userId),
  };
}

/** Public signup always creates a borrower. Staff accounts come from the seed or an admin. */
export async function signup(input: SignupInput): Promise<AuthResult> {
  const borrowerRole = await RoleModel.findOne({ name: ROLE_NAMES.BORROWER }).select('_id').lean();
  if (!borrowerRole) {
    throw new AppError(500, 'SETUP_INCOMPLETE', 'Roles are missing. Run `npm run seed` first.');
  }

  if (await UserModel.exists({ email: input.email })) {
    throw AppError.conflict('EMAIL_TAKEN', 'An account with this email already exists');
  }
  // Two signups racing past the check above hit the unique index → 409 in the error handler.
  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    roles: [borrowerRole._id],
    applicationStage: APPLICATION_STAGES.REGISTERED,
  });

  return buildAuthResult(user.id, user.name, user.email);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await UserModel.findOne({ email: input.email })
    .select('+passwordHash name email isActive')
    .lean();

  // Always run bcrypt so response time doesn't reveal whether the email exists.
  const passwordMatches = await verifyPassword(
    input.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  if (!user || !passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }
  if (!user.isActive) {
    throw new AppError(401, 'ACCOUNT_DISABLED', 'This account has been disabled');
  }

  return buildAuthResult(user._id.toString(), user.name, user.email);
}

export async function getCurrentUser(
  access: UserAccess,
): Promise<{ user: PublicUser; permissions: string[] }> {
  const user = await UserModel.findById(access.id).select('name email').lean();
  if (!user) throw AppError.unauthenticated();

  return {
    user: { id: access.id, name: user.name, email: user.email, roles: access.roles },
    permissions: [...access.permissions],
  };
}
