import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const { pathname } = req.nextUrl

  // Define route sets
  const protectedRoutes = ['/resume']
  const authRoutes = ['/auth/login', '/auth/register']

  // Check if current path matches any protected or auth routes
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // 1. If user is NOT logged in and tries to access protected route -> redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL('/auth/login', req.url)
    // Optional: Add redirect parameter to return here after login
    // loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. If user IS logged in and tries to access auth routes -> redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

// Ensure the middleware runs on the relevant paths
export const config = {
  matcher: [
    '/resume/:path*',
    '/auth/login',
    '/auth/register'
  ]
}
