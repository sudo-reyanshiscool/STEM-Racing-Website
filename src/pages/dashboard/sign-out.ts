import type { APIRoute } from 'astro';
import { SESSION_COOKIE } from '../../lib/dashboard/session';

export const prerender = false;

// The middleware has checked the form's token by the time this runs.
export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE, { path: '/dashboard' });
  return redirect('/dashboard', 303);
};

export const GET: APIRoute = ({ redirect }) => redirect('/dashboard', 303);
