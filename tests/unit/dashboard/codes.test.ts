import { describe, expect, it } from 'vitest';
import { CODE_ALPHABET, codeMatches, formatCode, hashCode, makeCode, normaliseCode } from '../../../src/lib/dashboard/codes';

describe('access codes', () => {
  it('makes a code in three groups from letters and digits that are not easily confused', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = makeCode();
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{3}-[A-Z2-9]{3}$/);
      expect(code).not.toMatch(/[0O1IL]/);
    }
  });

  it('does not repeat a code in 500 tries', () => {
    const codes = new Set(Array.from({ length: 500 }, makeCode));
    expect(codes.size).toBe(500);
  });

  it('has no confusable character in its alphabet', () => {
    expect(CODE_ALPHABET).toHaveLength(31);
    expect(CODE_ALPHABET).not.toMatch(/[0O1IL]/);
  });

  it('formats ten characters as 4-3-3', () => {
    expect(formatCode('K7QMX4P9RT')).toBe('K7QM-X4P-9RT');
  });

  it('reads a code whatever its case, spaces and hyphens', () => {
    expect(normaliseCode('K7QM-X4P-9RT')).toBe('K7QMX4P9RT');
    expect(normaliseCode('  k7qm x4p 9rt ')).toBe('K7QMX4P9RT');
    expect(normaliseCode('k7qmx4p9rt')).toBe('K7QMX4P9RT');
  });

  it('reads a code a mentor chose: a word, a hyphen and four characters', () => {
    expect(normaliseCode('WORD-2ABC')).toBe('WORD2ABC');
    expect(normaliseCode('longerword-2abc')).toBe('LONGERWORD2ABC');
  });

  it('allows 6 to 32 letters and digits', () => {
    expect(normaliseCode('ABC-123')).toBe('ABC123');
    expect(normaliseCode('A'.repeat(32))).toBe('A'.repeat(32));
  });

  it.each([
    ['empty', ''],
    ['hyphens alone', '------'],
    ['too short', 'AB-123'],
    ['too long', 'A'.repeat(33)],
    ['a symbol', 'WORD-2AB!'],
    ['a letter from another script', 'WORD-2ABЯ'],
    ['a very long entry', 'A'.repeat(100_000)],
  ])('refuses %s', (_name, input) => {
    expect(normaliseCode(input)).toBeUndefined();
  });

  it('matches a code with its own hash, however it is typed', async () => {
    const stored = await hashCode('K7QM-X4P-9RT');
    expect(await codeMatches('K7QM-X4P-9RT', stored)).toBe(true);
    expect(await codeMatches('k7qm x4p 9rt', stored)).toBe(true);
  });

  it('does not match another code', async () => {
    const stored = await hashCode('K7QM-X4P-9RT');
    expect(await codeMatches('K7QM-X4P-9RS', stored)).toBe(false);
    expect(await codeMatches('', stored)).toBe(false);
  });

  it('never stores the code and salts each hash', async () => {
    const first = await hashCode('K7QM-X4P-9RT');
    const second = await hashCode('K7QM-X4P-9RT');
    expect(first).toMatch(/^scrypt\.[\w-]+\.[\w-]+$/);
    // A dollar sign would be read as the start of a variable in a .env file.
    expect(first).not.toContain('$');
    expect(first).not.toContain('K7QM');
    expect(first).not.toBe(second);
  });

  it('refuses to hash something that is not a code', async () => {
    await expect(hashCode('hello')).rejects.toThrow('This is not an access code');
  });

  it.each([['empty', ''], ['no parts', 'scrypt'], ['another scheme', 'md5.abc.def'], ['a short key', 'scrypt.abcd.abcd']])(
    'does not match a stored value with %s',
    async (_name, stored) => {
      expect(await codeMatches('K7QM-X4P-9RT', stored)).toBe(false);
    },
  );
});
