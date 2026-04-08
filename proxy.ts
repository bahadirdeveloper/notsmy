import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === '/login';
  const isLanding = pathname === '/landing';
  const isApiAuth = pathname.startsWith('/api/auth');
  const isCron = pathname.startsWith('/api/cron');
  const isPublicAsset = pathname.startsWith('/icons/') || pathname === '/manifest.json' || pathname === '/sw.js';

  if (isApiAuth) return NextResponse.next();
  if (isCron) return NextResponse.next();
  if (isLanding || isPublicAsset) return NextResponse.next();
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/landing', req.url));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
