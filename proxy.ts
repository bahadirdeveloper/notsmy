import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const PWA_COOKIE = 'notsmy_pwa';
const PWA_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname, searchParams } = req.nextUrl;
  const isLoginPage = pathname === '/login';
  const isLanding = pathname === '/landing';
  const isApiAuth = pathname.startsWith('/api/auth');
  const isCron = pathname.startsWith('/api/cron');
  const isPublicAsset =
    pathname.startsWith('/icons/') || pathname === '/manifest.json' || pathname === '/sw.js';

  if (isApiAuth) return NextResponse.next();
  if (isCron) return NextResponse.next();
  if (isPublicAsset) return NextResponse.next();

  // Detect PWA launch via the ?source=pwa query param set in manifest.json's
  // start_url, and persist it as a cookie so subsequent navigations inside
  // the installed app remember they're running standalone.
  const isPwaQuery = searchParams.get('source') === 'pwa';
  const isPwaCookie = req.cookies.get(PWA_COOKIE)?.value === '1';
  const isPwa = isPwaQuery || isPwaCookie;

  // Build the redirect / pass-through decision first, then attach the cookie
  // at the very end so it lands on whichever response we return.
  let response: NextResponse;

  if (isLanding) {
    // PWA users should never see the marketing landing page — send them to
    // the app (if logged in) or login screen (if not) instead.
    if (isPwa) {
      response = NextResponse.redirect(new URL(isLoggedIn ? '/' : '/login', req.url));
    } else {
      response = NextResponse.next();
    }
  } else if (!isLoggedIn && !isLoginPage) {
    // Unauthenticated users go to /login inside the PWA, or /landing on
    // regular web visits.
    response = NextResponse.redirect(new URL(isPwa ? '/login' : '/landing', req.url));
  } else if (isLoggedIn && isLoginPage) {
    response = NextResponse.redirect(new URL('/', req.url));
  } else {
    response = NextResponse.next();
  }

  // Mark this client as a PWA if we saw the query marker. We only set it
  // when the query is present so bookmarking "/?source=pwa" is the sole way
  // to flip the flag on — not just anyone ever visiting the site.
  if (isPwaQuery) {
    response.cookies.set(PWA_COOKIE, '1', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: PWA_COOKIE_MAX_AGE,
    });
  }

  return response;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
