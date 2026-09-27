// Access codes. A code is shown once, when it is made, and stored only as a hash.
import { randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';

/** Letters and digits that are not easily confused: no 0, O, 1, I or L. */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** The length of a code the dashboard makes. A mentor may choose a code of another length. */
export const CODE_LENGTH = 10;

const KEY_BYTES = 32;

/** "K7QMX4P9RT" becomes "K7QM-X4P-9RT". */
export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4, 7)}-${code.slice(7)}`;
}

export function makeCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return formatCode(code);
}

export const CODE_MIN = 6;
export const CODE_MAX = 32;

/**
 * What a person typed, as the letters and digits of a code. Case, spaces and hyphens do not
 * matter. Undefined when it cannot be a code, so that no hash is worked out for it.
 */
export function normaliseCode(input: string): string | undefined {
  // Nothing longer than this can be a code, and it keeps the work below small.
  if (input.length > CODE_MAX * 4) return undefined;
  const code = input.toUpperCase().replace(/[\s-]/g, '');
  return new RegExp(`^[A-Z0-9]{${CODE_MIN},${CODE_MAX}}$`).test(code) ? code : undefined;
}

function derive(code: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(code, salt, KEY_BYTES, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

/**
 * The stored form: "scrypt.salt.key", with a new salt for each code. The parts are joined by
 * dots because the mentor code's hash is kept in a .env file, where a dollar sign starts a variable.
 */
export async function hashCode(input: string): Promise<string> {
  const code = normaliseCode(input);
  if (code === undefined) throw new Error('This is not an access code');
  const salt = randomBytes(16);
  const key = await derive(code, salt);
  return `scrypt.${salt.toString('base64url')}.${key.toString('base64url')}`;
}

export async function codeMatches(input: string, stored: string): Promise<boolean> {
  const code = normaliseCode(input);
  const [scheme, salt, key] = stored.split('.');
  if (code === undefined || scheme !== 'scrypt' || !salt || !key) return false;
  const expected = Buffer.from(key, 'base64url');
  if (expected.length !== KEY_BYTES) return false;
  return timingSafeEqual(await derive(code, Buffer.from(salt, 'base64url')), expected);
}
