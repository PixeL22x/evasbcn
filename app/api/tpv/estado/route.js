import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Obtiene la fecha actual en formato YYYY-MM-DD
function getFechaHoyStr() {
  const ahora = new Date()
  return ahora.toISOString().split('T')[0]
}

// GET — Consulta el estado actual del TPV
export async function GET(request) {
  try {
    const config = await prisma.configuracion.findUnique({
      where: { clave: 'tpv_estado' }
    })

    const hoy = getFechaHoyStr()

    if (config && config.valor) {
      // Verificar si el estado guardado corresponde a hoy
      if (config.valor.fecha === hoy && config.valor.cerrado) {
        return NextResponse.json({
          cerrado: true,
          fecha: hoy,
          mensaje: 'El TPV ya ha sido cerrado por hoy.'
        })
      }
    }

    return NextResponse.json({
      cerrado: false,
      fecha: hoy
    })
  } catch (error) {
    console.error('[TPV] Error fetching estado:', error)
    return NextResponse.json({ error: 'Error al obtener estado' }, { status: 500 })
  }
}

// POST — Actualiza el estado del TPV (lo cierra)
export async function POST(request) {
  try {
    const { cerrado } = await request.json()
    const hoy = getFechaHoyStr()

    const config = await prisma.configuracion.upsert({
      where: { clave: 'tpv_estado' },
      update: {
        valor: {
          fecha: hoy,
          cerrado: cerrado === true
        }
      },
      create: {
        clave: 'tpv_estado',
        valor: {
          fecha: hoy,
          cerrado: cerrado === true
        }
      }
    })

    return NextResponse.json({ success: true, estado: config.valor })
  } catch (error) {
    console.error('[TPV] Error updating estado:', error)
    return NextResponse.json({ error: 'Error al actualizar estado' }, { status: 500 })
  }
}
