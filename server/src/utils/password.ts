import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

/**
 * A real bcrypt hash checked when the email doesn't exist, so a failed login takes the same time
 * either way and doesn't reveal which emails are registered. Generated once at startup.
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-password', SALT_ROUNDS);
