import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { uploadImage } from '../../../../lib/cloudinary'

export async function POST(request) {
  try {
    console.log('📸 Subida progresiva de foto individual...')

    const formData = await request.formData()

    const cierreId = formData.get('cierreId')
    const trabajador = formData.get('trabajador')
    const tareaId = formData.get('tareaId')
    const tipo = formData.get('tipo')
    const descripcion = formData.get('descripcion')
    const file = formData.get('file')

    console.log('📋 Datos recibidos:', { cierreId, trabajador, tareaId, tipo, descripcion })

    if (!cierreId || !trabajador || !tareaId || !tipo || !file) {
      console.error('❌ Faltan datos requeridos')
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Validar tamaño del archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error(`❌ Archivo demasiado grande: ${(file.size / (1024 * 1024)).toFixed(2)}MB`)
      return NextResponse.json(
        { error: `Archivo demasiado grande: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Máximo permitido: 10MB` },
        { status: 413 }
      )
    }

    console.log(`📷 Procesando foto: ${tipo} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`)

    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)

    // Subir a Cloudinary
    const fileName = `${tipo}_${Date.now()}`
    const uploadResult = await uploadImage(buffer, fileName, 'evas-barcelona')

    console.log(`✅ Foto ${tipo} subida exitosamente: ${uploadResult.secure_url}`)

    // ⭐ LIBERAR MEMORIA EXPLÍCITAMENTE
    buffer = null
    if (global.gc) {
      global.gc()
      console.log('🧹 Buffer liberado y GC ejecutado')
    }

    // Guardar en base de datos
    const fotoData = {
      tipo,
      descripcion,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      size: file.size,
      uploadedAt: new Date()
    }

    // Actualizar la tarea con la nueva foto
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId }
    })

    if (!tarea) {
      console.error('❌ Tarea no encontrada:', tareaId)
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    // Obtener fotos existentes
    let fotosSubidas = []
    if (tarea.fotosSubidas) {
      try {
        fotosSubidas = typeof tarea.fotosSubidas === 'string'
          ? JSON.parse(tarea.fotosSubidas)
          : tarea.fotosSubidas
      } catch (error) {
        console.error('Error parsing fotosSubidas:', error)
        fotosSubidas = []
      }
    }

    // Agregar nueva foto
    fotosSubidas.push(fotoData)

    // Actualizar tarea
    await prisma.tarea.update({
      where: { id: tareaId },
      data: {
        fotosSubidas: JSON.stringify(fotosSubidas)
      }
    })

    console.log(`✅ Foto ${tipo} guardada en base de datos`)

    return NextResponse.json({
      success: true,
      foto: fotoData,
      message: `Foto ${tipo} subida exitosamente`
    })

  } catch (error) {
    console.error('❌ Error en subida progresiva:', error)

    // Categorizar el error
    let errorCategory = 'unknown'
    let statusCode = 500

    if (error.message.includes('timeout')) {
      errorCategory = 'timeout'
      statusCode = 408
    } else if (error.message.includes('too large') || error.message.includes('413')) {
      errorCategory = 'file_size'
      statusCode = 413
    } else if (error.message.includes('Cloudinary')) {
      errorCategory = 'cloudinary'
      statusCode = 502
    }

    return NextResponse.json(
      {
        error: error.message,
        category: errorCategory,
        details: {
          message: error.message,
          stack: error.stack
        }
      },
      { status: statusCode }
    )
  }
}
