import { NextResponse } from 'next/server'

export function middleware(request) {
  // Solo aplicar middleware a rutas de admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Verificar si hay token de autenticación en las cookies
    const token = request.cookies.get('auth-token')
    
    if (!token) {
      // Redirigir al login si no hay token
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}
