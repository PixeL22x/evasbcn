import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'evas-barcelona-super-secret-key-2024'

export async function GET(request) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Verificar que el usuario aún existe y está activo
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: decoded.userId }
    })

    if (!trabajador || !trabajador.activo) {
      return NextResponse.json(
        { error: 'Usuario no válido' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: trabajador.id,
        username: trabajador.nombre,
        role: trabajador.nombre === 'admin' ? 'admin' : 'worker',
        name: trabajador.nombre === 'admin' ? 'Administrador' : trabajador.nombre
      }
    })

  } catch (error) {
    console.error('Error verificando token:', error)
    return NextResponse.json(
      { error: 'Token no válido' },
      { status: 401 }
    )
  }
}
