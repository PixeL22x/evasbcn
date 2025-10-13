import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST: Crear múltiples excepciones de horario en batch
// body: { excepciones: [{ trabajadorId: string, fecha: 'YYYY-MM-DD', turno: 'M'|'T'|'L', motivo?: string }] }
export async function POST(request) {
  try {
    const { excepciones } = await request.json()
    
    if (!excepciones || !Array.isArray(excepciones) || excepciones.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de excepciones' }, { status: 400 })
    }

    // Validar datos
    const validTurnos = new Set(['M', 'T', 'L'])
    for (const excepcion of excepciones) {
      if (!excepcion.trabajadorId || !excepcion.fecha || !excepcion.turno) {
        return NextResponse.json({ error: 'Cada excepción debe tener trabajadorId, fecha y turno' }, { status: 400 })
      }
      if (!validTurnos.has(excepcion.turno)) {
        return NextResponse.json({ error: 'Turno inválido' }, { status: 400 })
      }
    }

    // Usar transacción para operaciones atómicas
    const result = await prisma.$transaction(async (tx) => {
      const createdExcepciones = []
      
      // Procesar cada excepción
      for (const excepcion of excepciones) {
        const fecha = new Date(`${excepcion.fecha}T00:00:00.000Z`)
        
        // Eliminar excepción existente para esa fecha y trabajador
        await tx.excepcionHorario.deleteMany({ 
          where: { 
            trabajadorId: excepcion.trabajadorId, 
            fecha: fecha 
          } 
        })
        
        // Crear nueva excepción
        const created = await tx.excepcionHorario.create({
          data: { 
            trabajadorId: excepcion.trabajadorId, 
            fecha: fecha, 
            turno: excepcion.turno, 
            motivo: excepcion.motivo || null 
          },
        })
        
        createdExcepciones.push(created)
      }
      
      return createdExcepciones
    })

    return NextResponse.json({ 
      success: true, 
      message: `${excepciones.length} excepciones guardadas exitosamente`,
      excepciones: result 
    })

  } catch (error) {
    console.error('Error POST /api/horarios/excepciones/batch', error)
    return NextResponse.json({ error: 'Error al guardar excepciones en batch' }, { status: 500 })
  }
}
