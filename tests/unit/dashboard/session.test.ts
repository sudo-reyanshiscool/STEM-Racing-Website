import { describe, expect, it } from 'vitest';
import {
  formToken,
  formTokenMatches,
  newSession,
  readSession,
  SESSION_SECONDS,
  signSession,
  type Session,
} from '../../../src/lib/dashboard/session';

const SECRET = 'a'.repeat(32);
const NOW = Date.UTC(2026, 8, 28, 9, 0, 0);
const team: Session = newSession('team', 7, 3, NOW);

describe('sessions', () => {
  it('lasts 30 days', () => {
    expect(SESSION_SECONDS).toBe(2_592_000);
    expect(team.expires).toBe(NOW / 1000 + 2_592_000);
  });

  it('reads back what it signed', () => {
    expect(readSession(signSession(team, SECRET), SECRET, NOW)).toEqual(team);
    const mentor = newSession('mentor', null, 0, NOW);
    expect(readSession(signSession(mentor, SECRET), SECRET, NOW)).toEqual(mentor);
  });

  it('refuses a cookie signed with another secret', () => {
    expect(readSession(signSession(team, 'b'.repeat(32)), SECRET, NOW)).toBeUndefined();
  });

  it('refuses a cookie whose team was changed', () => {
    const [, signature] = signSession(team, SECRET).split('.');
    const forged = Buffer.from(JSON.stringify({ ...team, teamId: 8 })).toString('base64url');
    expect(readSession(`${forged}.${signature}`, SECRET, NOW)).toBeUndefined();
  });

  it('refuses a team cookie turned into a mentor cookie', () => {
    const [, signature] = signSession(team, SECRET).split('.');
    const forged = Buffer.from(JSON.stringify({ ...team, role: 'mentor', teamId: null })).toString('base64url');
    expect(readSession(`${forged}.${signature}`, SECRET, NOW)).toBeUndefined();
  });

  it('ends at its expiry and not before', () => {
    const cookie = signSession(team, SECRET);
    expect(readSession(cookie, SECRET, team.expires * 1000 - 1)).toEqual(team);
    expect(readSession(cookie, SECRET, team.expires * 1000)).toBeUndefined();
  });

  it.each([
    ['nothing', undefined],
    ['an empty value', ''],
    ['no dot', 'abc'],
    ['two dots', 'a.b.c'],
    ['no signature', 'abc.'],
    ['text that is not base64', '%%%.%%%'],
    ['a very long value', 'a'.repeat(100_000)],
  ])('refuses %s', (_name, value) => {
    expect(readSession(value, SECRET, NOW)).toBeUndefined();
  });

  it.each([
    ['a team session with no team', { role: 'team', teamId: null, codeVersion: 1, expires: 9_999_999_999 }],
    ['a mentor session with a team', { role: 'mentor', teamId: 3, codeVersion: 0, expires: 9_999_999_999 }],
    ['an unknown role', { role: 'admin', teamId: null, codeVersion: 0, expires: 9_999_999_999 }],
    ['a team id that is not a whole number', { role: 'team', teamId: '7', codeVersion: 1, expires: 9_999_999_999 }],
    ['no expiry', { role: 'team', teamId: 7, codeVersion: 1 }],
    ['a list', []],
  ])('refuses a signed cookie that holds %s', (_name, body) => {
    expect(readSession(signSession(body as unknown as Session, SECRET), SECRET, NOW)).toBeUndefined();
  });

  it('will not sign with a short secret', () => {
    expect(() => signSession(team, 'short')).toThrow('SESSION_SECRET needs 32 characters or more');
  });
});

describe('form tokens', () => {
  const cookie = signSession(team, SECRET);

  it('matches the cookie it was made for', () => {
    expect(formTokenMatches(formToken(cookie, SECRET), cookie, SECRET)).toBe(true);
  });

  it('does not match another session', () => {
    const other = signSession(newSession('team', 8, 1, NOW), SECRET);
    expect(formTokenMatches(formToken(other, SECRET), cookie, SECRET)).toBe(false);
  });

  it.each([['nothing', undefined], ['an empty value', ''], ['a file', new Blob(['x'])], ['a wrong value', 'abc']])(
    'does not match %s',
    (_name, token) => {
      expect(formTokenMatches(token, cookie, SECRET)).toBe(false);
    },
  );

  it('is not the session signature', () => {
    expect(cookie).not.toContain(formToken(cookie, SECRET));
  });
});
