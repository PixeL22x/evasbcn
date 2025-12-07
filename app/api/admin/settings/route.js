import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// Configurar como ruta dinámica
export const dynamic = 'force-dynamic'

// GET - Obtener configuraciones
export async function GET() {
  try {
    // Por ahora retornamos configuraciones por defecto
    // En el futuro se pueden almacenar en la base de datos
    const defaultSettings = {
      general: {
        nombreTienda: "Evas Barcelona",
        direccion: "Barcelona, España",
        telefono: "+34 123 456 789",
        email: "admin@evasbarcelona.com",
        timezone: "Europe/Madrid"
      },
      cierres: {
        tiempoLimite: 45,
        requiereFotos: true,
        validacionAutomatica: false,
        notificacionesEmail: true,
        backupAutomatico: true
      },
      trabajadores: {
        maxTrabajadores: 50,
        requiereValidacion: true,
        notificacionesNuevos: true,
        autoActivar: false
      },
      fotos: {
        maxTamaño: 5, // MB
        formatosPermitidos: ["jpg", "jpeg", "png", "webp"],
        compresionAutomatica: true,
        calidad: 85
      },
      notificaciones: {
        email: true,
        push: false,
        sms: false,
        webhook: false
      },
      sistema: {
        logLevel: "info",
        cacheEnabled: true,
        compressionEnabled: true
      }
    }

    return NextResponse.json({
      success: true,
      settings: defaultSettings
    })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Guardar configuraciones
export async function POST(request) {
  try {
    const { settings } = await request.json()

    if (!settings) {
      return NextResponse.json(
        { error: 'Configuraciones son requeridas' },
        { status: 400 }
      )
    }

    // Por ahora solo validamos y retornamos éxito
    // En el futuro se pueden almacenar en la base de datos
    console.log('Guardando configuraciones:', settings)

    return NextResponse.json({
      success: true,
      message: 'Configuraciones guardadas exitosamente'
    })

  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

