// Vercel calls this once a day, so that Supabase does not pause the project for lack of use.
import { timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { cronSecret, getDb } from '../../../lib/dashboard/runtime';

export const prerender = false;

function allowed(header: string | null): boolean {
  const secret = cronSecret();
  if (!secret || !header) return false;
  const sent = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return sent.length === expected.length && timingSafeEqual(sent, expected);
}

export const GET: APIRoute = async ({ request }) => {
  if (!allowed(request.headers.get('authorization'))) return new Response('Not found', { status: 404 });
  await getDb().query('select 1');
  return new Response('awake');
};
