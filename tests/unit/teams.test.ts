import { describe, expect, it } from 'vitest';
import { parseMember } from '../../src/lib/teams';

describe('parseMember', () => {
  it('splits the name from the role in brackets', () => {
    expect(parseMember('Priya Sharma (Team Principal)')).toEqual({ name: 'Priya Sharma', role: 'Team Principal' });
  });

  it('accepts a member with no role', () => {
    expect(parseMember('Priya Sharma')).toEqual({ name: 'Priya Sharma', role: undefined });
  });

  it('keeps accents and other scripts', () => {
    expect(parseMember('Zoë Müller (Design Engineer)')).toEqual({ name: 'Zoë Müller', role: 'Design Engineer' });
    expect(parseMember('प्रिया शर्मा (Enterprise Manager)')).toEqual({ name: 'प्रिया शर्मा', role: 'Enterprise Manager' });
  });

  it('tidies stray spaces', () => {
    expect(parseMember('  Priya Sharma   ( Team Principal )  ')).toEqual({
      name: 'Priya Sharma',
      role: 'Team Principal',
    });
  });

  it('treats brackets that are not at the end as part of the name', () => {
    expect(parseMember('Sam (Sammy) Lee')).toEqual({ name: 'Sam (Sammy) Lee', role: undefined });
  });

  it('does not lose text when the brackets are empty', () => {
    expect(parseMember('Priya Sharma ()')).toEqual({ name: 'Priya Sharma ()', role: undefined });
  });
});
