// Guards every page under /dashboard. The public pages are built ahead of time and pass through.
import { defineMiddleware } from 'astro:middleware';
import { DashboardUnavailable } from './lib/dashboard/db';
import { getDb, mentorCodeHash, sessionSecret } from './lib/dashboard/runtime';
import {
  formToken,
  formTokenMatches,
  mentorSessionStands,
  readSession,
  SESSION_COOKIE,
} from './lib/dashboard/session';
import { getTeam } from './lib/dashboard/store';

const SIGN_IN = '/dashboard';
const UNAVAILABLE = '/dashboard/unavailable';
/** Pages that need no session. */
const OPEN = new Set([SIGN_IN, UNAVAILABLE, '/dashboard/api/keep-awake']);

function isDashboard(path: string): boolean {
  return path === SIGN_IN || path.startsWith(`${SIGN_IN}/`);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname.replace(/\/+$/, '') || '/';
  if (context.isPrerendered || !isDashboard(path)) return next();

  let response: Response;
  try {
    // This page is shown when a setting is missing, so it must need none.
    response = path === UNAVAILABLE ? await next() : await guard();
  } catch (error) {
    if (!(error instanceof DashboardUnavailable)) throw error;
    console.error('Dashboard unavailable:', error.message);
    // A new request, because a form's body may have been read and cannot be sent on twice.
    response = await context.rewrite(new Request(new URL(UNAVAILABLE, context.url)));
  }
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store');
  return response;

  async function guard(): Promise<Response> {
    const cookie = context.cookies.get(SESSION_COOKIE)?.value;
    const session = readSession(cookie, sessionSecret());
    const leave = (reason: 'again' | 'closed') => {
      context.cookies.delete(SESSION_COOKIE, { path: SIGN_IN });
      return context.redirect(`${SIGN_IN}?${reason}=1`, 303);
    };

    if (!cookie || !session) {
      if (OPEN.has(path)) return next();
      return leave('again');
    }

    let team;
    if (session.role === 'mentor') {
      // Changing the mentor code, or taking it away, ends every mentor session.
      if (!mentorSessionStands(session, mentorCodeHash(), sessionSecret())) return leave('again');
    } else {
      team = session.teamId === null ? undefined : await getTeam(getDb(), session.teamId);
      if (!team || team.codeVersion !== session.codeVersion) return leave('again');
      if (team.archived) return leave('closed');
    }

    const home = session.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/team';
    if (path === SIGN_IN) return context.redirect(home, 303);
    if (!OPEN.has(path) && path !== '/dashboard/sign-out' && path !== home && !path.startsWith(`${home}/`)) {
      return context.redirect(home, 303);
    }

    const secret = sessionSecret();
    if (context.request.method !== 'GET' && context.request.method !== 'HEAD' && !OPEN.has(path)) {
      let sent: unknown;
      try {
        sent = (await context.request.clone().formData()).get('token');
      } catch {
        sent = undefined;
      }
      if (!formTokenMatches(sent, cookie, secret)) {
        return new Response('This form has expired. Go back and reload the page.', { status: 403 });
      }
    }

    context.locals.dashboard = { session, team, token: formToken(cookie, secret) };
    return next();
  }
});
