import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('box-drop-auth');
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth');
  const isWebhookHealth = request.nextUrl.pathname === '/api/webhook/health';
  const isAutoApi = request.nextUrl.pathname.startsWith('/api/drops/auto') ||
                    request.nextUrl.pathname.startsWith('/api/routes/optimize') ||
                    request.nextUrl.pathname.startsWith('/api/automation');

  // Allow public API endpoints (webhook health, auto-drop creation, automation logs)
  if (isApiAuth || isWebhookHealth || isAutoApi) return NextResponse.next();

  if (!authCookie || authCookie.value !== 'authenticated') {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
