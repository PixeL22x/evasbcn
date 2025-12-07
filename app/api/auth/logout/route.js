import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Crear respuesta con cookie vacía para eliminar la sesión
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    })

    // Eliminar la cookie de autenticación
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expirar inmediatamente
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
