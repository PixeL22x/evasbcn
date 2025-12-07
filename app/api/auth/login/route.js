import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'evas-barcelona-super-secret-key-2024'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar trabajador en la base de datos
    const trabajador = await prisma.trabajador.findUnique({
      where: { nombre: username }
    })

    if (!trabajador || !trabajador.activo) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, trabajador.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Crear token JWT
    const token = jwt.sign(
      { 
        userId: trabajador.id, 
        username: trabajador.nombre,
        role: trabajador.nombre === 'admin' ? 'admin' : 'worker'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Crear respuesta con cookie HTTP-only
    const response = NextResponse.json({
      success: true,
      user: {
        id: trabajador.id,
        username: trabajador.nombre,
        role: trabajador.nombre === 'admin' ? 'admin' : 'worker',
        name: trabajador.nombre === 'admin' ? 'Administrador' : trabajador.nombre
      }
    })

    // Configurar cookie HTTP-only
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 horas
    })

    return response

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true })
    
    // Eliminar cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
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
