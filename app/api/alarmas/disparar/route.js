import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/alarmas/disparar
 * Body: { alarmaId, trabajadorNombre, trabajadorId?, descartada }
 * 
 * Registra que una alarma fue disparada y/o descartada por un trabajador.
 * Si ya existe un registro de hoy para esa alarma + trabajador, lo actualiza.
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { alarmaId, trabajadorNombre, trabajadorId, descartada = false } = body

    if (!alarmaId || !trabajadorNombre) {
      return NextResponse.json(
        { error: 'alarmaId y trabajadorNombre son obligatorios' },
        { status: 400 }
      )
    }

    // Inicio del día actual para buscar si ya existe un disparo hoy
    const hoyInicio = new Date()
    hoyInicio.setHours(0, 0, 0, 0)

    // Buscar si ya hay un disparo hoy para esta alarma + trabajador
    const disparoExistente = await prisma.disparoAlarma.findFirst({
      where: {
        alarmaId,
        trabajadorNombre,
        fecha: { gte: hoyInicio },
      },
    })

    let disparo
    if (disparoExistente) {
      // Actualizar el registro existente
      disparo = await prisma.disparoAlarma.update({
        where: { id: disparoExistente.id },
        data: {
          descartada,
          descartadaAt: descartada ? new Date() : null,
        },
      })
    } else {
      // Crear nuevo registro de disparo
      disparo = await prisma.disparoAlarma.create({
        data: {
          alarmaId,
          trabajadorNombre,
          trabajadorId: trabajadorId || null,
          descartada,
          descartadaAt: descartada ? new Date() : null,
        },
      })
    }

    return NextResponse.json({ disparo, success: true })
  } catch (error) {
    console.error('Error al registrar disparo de alarma:', error)
    return NextResponse.json({ error: 'Error al registrar disparo' }, { status: 500 })
  }
}
