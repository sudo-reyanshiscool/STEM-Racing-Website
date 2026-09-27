// The signed cookie that keeps a team or a mentor signed in. No Astro imports.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'tbs_dashboard';
export const SESSION_DAYS = 30;
export const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;

export interface Session {
  role: 'team' | 'mentor';
  /** The team a team session belongs to. Null for a mentor. */
  teamId: number | null;
  /** For a team, its code_version when the session began. For a mentor, mentorVersion(). */
  codeVersion: number;
  /** When the session ends, in seconds since 1970. */
  expires: number;
}

const MIN_SECRET = 32;

function mac(text: string, secret: string): Buffer {
  if (secret.length < MIN_SECRET) throw new Error(`SESSION_SECRET needs ${MIN_SECRET} characters or more`);
  return createHmac('sha256', secret).update(text).digest();
}

function sameBytes(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function newSession(role: Session['role'], teamId: number | null, codeVersion: number, now = Date.now()): Session {
  return { role, teamId, codeVersion, expires: Math.floor(now / 1000) + SESSION_SECONDS };
}

/** The cookie value: the session as base64url JSON, a dot, and its signature. */
export function signSession(session: Session, secret: string): string {
  const body = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${body}.${mac(`session:${body}`, secret).toString('base64url')}`;
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  const teamOk =
    s.role === 'team' ? Number.isInteger(s.teamId) && (s.teamId as number) > 0 : s.role === 'mentor' && s.teamId === null;
  return teamOk && Number.isInteger(s.codeVersion) && Number.isInteger(s.expires);
}

/** The session in a cookie value. Undefined when it is missing, altered, malformed or past its end. */
export function readSession(value: string | undefined, secret: string, now = Date.now()): Session | undefined {
  if (!value) return undefined;
  const [body, signature, ...rest] = value.split('.');
  if (!body || !signature || rest.length > 0) return undefined;
  if (!sameBytes(Buffer.from(signature, 'base64url'), mac(`session:${body}`, secret))) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return undefined;
  }
  if (!isSession(parsed) || parsed.expires * 1000 <= now) return undefined;
  return parsed;
}

/**
 * A number that stands for the mentor code, made from its hash. A mentor session carries it,
 * so changing the mentor code ends every mentor session, as resetting a team's code does.
 */
export function mentorVersion(mentorCodeHash: string, secret: string): number {
  // 31 bits, and never 0, which sessions made before this check carried.
  return (mac(`mentor:${mentorCodeHash}`, secret).readUInt32BE(0) & 0x7fffffff) || 1;
}

export function mentorSessionStands(session: Session, mentorCodeHash: string | undefined, secret: string): boolean {
  if (session.role !== 'mentor' || !mentorCodeHash) return false;
  return session.codeVersion === mentorVersion(mentorCodeHash, secret);
}

/** The token a form carries. It belongs to one cookie value, so it ends when the session does. */
export function formToken(cookieValue: string, secret: string): string {
  return mac(`form:${cookieValue}`, secret).toString('base64url');
}

export function formTokenMatches(token: unknown, cookieValue: string, secret: string): boolean {
  if (typeof token !== 'string' || token === '') return false;
  return sameBytes(Buffer.from(token, 'base64url'), mac(`form:${cookieValue}`, secret));
}
