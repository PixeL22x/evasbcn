import { NextResponse } from 'next/server'

export function middleware(request) {
  // Manejar CORS (preflight OPTIONS) para todas las rutas de la API
  if (request.nextUrl.pathname.startsWith('/api')) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key',
        },
      })
    }
  }

  // Solo aplicar middleware de auth a rutas de admin
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
    '/api/:path*',
  ],
}
