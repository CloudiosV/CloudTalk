import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const isAuthRoute = pathname.startsWith('/auth');
  const isProtectedRoute = pathname === '/' || pathname.startsWith('/chat') || pathname.startsWith('/friend');

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (token) {
    try {
      await jwtVerify(token, secret);

      if (isAuthRoute) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/auth/:path*',
    '/chat/:path*', 
    '/friend/:path*',
  ],
};