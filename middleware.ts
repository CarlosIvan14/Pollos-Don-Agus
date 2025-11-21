import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  const isProtected = ['/caja', '/admin', '/corte'].some(p => req.nextUrl.pathname.startsWith(p));
  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/caja/:path*', '/admin/:path*', '/corte/:path*'],
};
