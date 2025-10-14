import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fromZonedTime } from 'date-fns-tz'

// POST: Crear múltiples excepciones de horario en batch
// body: { excepciones: [{ trabajadorId: string, fecha: 'YYYY-MM-DD', turno: 'M'|'T'|'L', motivo?: string }] }
export async function POST(request) {
  try {
    const { excepciones } = await request.json()
    
    // Debug: Log de las excepciones recibidas
    console.log(`📊 Excepciones recibidas: ${excepciones.length}`)
    console.log('🔍 Primeras 5 excepciones:', excepciones.slice(0, 5))
    
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

    // Agrupar excepciones por trabajador para optimizar las operaciones
    const excepcionesPorTrabajador = {}
    excepciones.forEach(excepcion => {
      if (!excepcionesPorTrabajador[excepcion.trabajadorId]) {
        excepcionesPorTrabajador[excepcion.trabajadorId] = []
      }
      excepcionesPorTrabajador[excepcion.trabajadorId].push(excepcion)
    })

    // Debug: Log del agrupamiento
    console.log('👥 Trabajadores encontrados:', Object.keys(excepcionesPorTrabajador).length)
    Object.entries(excepcionesPorTrabajador).forEach(([trabajadorId, excepciones]) => {
      console.log(`  - Trabajador ${trabajadorId}: ${excepciones.length} excepciones`)
    })

    const barcelonaTimeZone = 'Europe/Madrid'
    const createdExcepciones = []

    // Procesar cada trabajador por separado para evitar transacciones muy largas
    for (const [trabajadorId, excepcionesTrabajador] of Object.entries(excepcionesPorTrabajador)) {
      // Usar transacción optimizada con createMany
      const result = await prisma.$transaction(async (tx) => {
        // Preparar fechas en UTC para este trabajador
        const fechas = excepcionesTrabajador.map(exc => {
          const barcelonaDate = new Date(`${exc.fecha}T00:00:00`)
          return fromZonedTime(barcelonaDate, barcelonaTimeZone)
        })
        
        // Eliminar todas las excepciones existentes para este trabajador en estas fechas
        await tx.excepcionHorario.deleteMany({ 
          where: { 
            trabajadorId: trabajadorId,
            fecha: { in: fechas }
          } 
        })
        
        // Preparar datos para createMany
        const dataToCreate = excepcionesTrabajador.map(excepcion => {
          const barcelonaDate = new Date(`${excepcion.fecha}T00:00:00`)
          const utcDate = fromZonedTime(barcelonaDate, barcelonaTimeZone)
          
          return {
            trabajadorId: excepcion.trabajadorId,
            fecha: utcDate,
            turno: excepcion.turno,
            motivo: excepcion.motivo || null
          }
        })
        
        // Crear todas las excepciones de una vez usando createMany
        await tx.excepcionHorario.createMany({
          data: dataToCreate
        })
        
        // Retornar las excepciones creadas para el response
        return await tx.excepcionHorario.findMany({
          where: {
            trabajadorId: trabajadorId,
            fecha: { in: fechas }
          }
        })
      }, {
        timeout: 10000, // Reducido a 10 segundos
        maxWait: 3000, // Reducido a 3 segundos
      })
      
      createdExcepciones.push(...result)
    }

    return NextResponse.json({ 
      success: true, 
      message: `${excepciones.length} excepciones guardadas exitosamente`,
      excepciones: createdExcepciones 
    })

  } catch (error) {
    console.error('Error POST /api/horarios/excepciones/batch', error)
    return NextResponse.json({ error: 'Error al guardar excepciones en batch' }, { status: 500 })
  }
}
