import { NextResponse } from 'next/server'
import { prisma, connectDB } from '../../../lib/prisma'

export async function GET() {
  try {
    // Verificar conexión
    const isConnected = await connectDB()
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          error: 'No se pudo conectar a SQLite',
          database_url: 'SQLite local'
        },
        { status: 500 }
      )
    }

    // Probar una consulta simple
    const testQuery = await prisma.cierre.count()
    
    return NextResponse.json({
      status: 'success',
      message: 'Conexión a SQLite exitosa',
      database_url: 'SQLite local',
      total_cierres: testQuery,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error en debug:', error)
      return NextResponse.json(
        { 
          error: error.message,
          database_url: 'SQLite local',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
  }
}


