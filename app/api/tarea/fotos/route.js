import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { uploadImage } from '../../../../lib/cloudinary'

export async function POST(request) {
  try {
    console.log('📸 Iniciando subida de fotos de tarea...')
    
    // Configurar timeout para la operación completa
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 90 seconds')), 90000)
    })
    
    const uploadPromise = async () => {
      const formData = await request.formData()
      
      const cierreId = formData.get('cierreId')
      const trabajador = formData.get('trabajador')
      const tareaId = formData.get('tareaId')

      console.log('📋 Datos recibidos:', { cierreId, trabajador, tareaId })

      if (!cierreId || !trabajador || !tareaId) {
        console.error('❌ Faltan datos requeridos:', { cierreId, trabajador, tareaId })
        return NextResponse.json(
          { error: 'Faltan datos requeridos' },
          { status: 400 }
        )
      }

    // Obtener las fotos del formulario
    console.log('🔍 Recolectando fotos del FormData...')
    
    // Mostrar resumen del FormData
    const keys = Array.from(formData.keys())
    console.log(`📋 FormData contiene: ${keys.length} campos`)
    
    // Recolectar todas las fotos primero
    const fotosParaSubir = []
    let index = 0
    
    while (formData.has(`foto_${index}`)) {
      const file = formData.get(`foto_${index}`)
      const tipo = formData.get(`tipo_${index}`)
      const descripcion = formData.get(`descripcion_${index}`)
      
      console.log(`📷 Encontrada foto ${index}:`, { 
        file: file ? `${file.name} (${file.size} bytes)` : 'null', 
        tipo, 
        descripcion 
      })
      
      if (file && tipo && descripcion) {
        fotosParaSubir.push({
          file,
          tipo,
          descripcion,
          index
        })
      }
      index++
    }

    console.log(`📊 Total de fotos a procesar: ${fotosParaSubir.length}`)

      // Función para procesar una foto individual con timeout individual
      const procesarFoto = async (fotoData) => {
        const { file, tipo, descripcion, index } = fotoData
        
        const fotoTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout uploading photo ${tipo}`)), 60000)
        })
        
        const fotoUploadPromise = async () => {
          try {
            console.log(`🔄 Procesando foto ${index + 1}/${fotosParaSubir.length}: ${tipo}`)
            
            // Validar tamaño del archivo (máximo 50MB para archivos originales)
            if (file.size > 50 * 1024 * 1024) {
              throw new Error(`Foto ${tipo} es demasiado grande (${Math.round(file.size / 1024 / 1024)}MB). Máximo permitido: 50MB`)
            }
            
            // Convertir el archivo a buffer
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            
            // Generar nombre único para la imagen
            const fileName = `tarea_${tareaId}_${tipo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const folder = `evas-barcelona/cierres/${cierreId}`
            
            // Subir a Cloudinary con timeout individual
            const result = await uploadImage(buffer, fileName, folder)
            
            return {
              tipo,
              descripcion,
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              timestamp: new Date()
            }
          } catch (uploadError) {
            console.error(`❌ Error procesando foto ${tipo}:`, uploadError)
            
            // Categorizar el error para mejor debugging
            let errorCategory = 'unknown'
            if (uploadError.message.includes('Cloudinary')) {
              errorCategory = 'cloudinary'
            } else if (uploadError.message.includes('Sharp')) {
              errorCategory = 'compression'
            } else if (uploadError.message.includes('timeout')) {
              errorCategory = 'timeout'
            } else if (uploadError.message.includes('network') || uploadError.message.includes('ENOTFOUND')) {
              errorCategory = 'network'
            } else if (uploadError.message.includes('demasiado grande')) {
              errorCategory = 'file_size'
            }
            
            console.error(`❌ Error category: ${errorCategory}`)
            throw uploadError
          }
        }
        
        // Ejecutar con timeout individual
        return Promise.race([fotoUploadPromise(), fotoTimeoutPromise])
      }

    // Subir fotos en paralelo (máximo 3 a la vez para no sobrecargar)
    console.log('🚀 Iniciando subida paralela de fotos...')
    // Forzar subidas secuenciales para máxima compatibilidad en Vercel
    const BATCH_SIZE = 1
    const fotos = []
    
    for (let i = 0; i < fotosParaSubir.length; i += BATCH_SIZE) {
      const batch = fotosParaSubir.slice(i, i + BATCH_SIZE)
      console.log(`📦 Procesando lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} fotos`)
      
      try {
        // Procesar lote en paralelo
        const resultados = await Promise.allSettled(
          batch.map(foto => procesarFoto(foto))
        )
        
        // Procesar resultados
        resultados.forEach((resultado, batchIndex) => {
          if (resultado.status === 'fulfilled') {
            fotos.push(resultado.value)
            console.log(`✅ Foto ${batch[batchIndex].tipo} subida exitosamente`)
          } else {
            console.error(`❌ Error en foto ${batch[batchIndex].tipo}:`, resultado.reason)
          }
        })
      } catch (batchError) {
        console.error(`❌ Error en lote:`, batchError)
      }
    }

    console.log(`📊 Total de fotos procesadas: ${fotos.length}`)
    
    if (fotos.length === 0) {
      console.error('❌ No se encontraron fotos para subir')
      return NextResponse.json(
        { error: 'No se encontraron fotos para subir' },
        { status: 400 }
      )
    }

    // Leer fotos existentes para hacer merge (evitar sobrescritura al subir por partes)
    console.log('📥 Leyendo fotos existentes de la tarea...')
    let existingFotos = []
    try {
      const tareaActual = await prisma.tarea.findUnique({
        where: { id: tareaId },
        select: { fotosSubidas: true }
      })
      if (tareaActual?.fotosSubidas) {
        try {
          const parsed = JSON.parse(tareaActual.fotosSubidas)
          if (Array.isArray(parsed)) existingFotos = parsed
        } catch (e) {
          console.warn('⚠️ No se pudieron parsear fotosSubidas existentes, se continuará con array vacío')
        }
      }
    } catch (e) {
      console.warn('⚠️ No se pudieron leer fotos existentes, se continuará con array vacío')
    }

    // Actualizar la tarea para incluir (merge) las fotos subidas
    console.log('💾 Guardando fotos en base de datos (merge)...')
    const updatedTarea = await prisma.tarea.update({
      where: { id: tareaId },
      data: {
        fotosSubidas: JSON.stringify([ ...existingFotos, ...fotos ]),
      },
    })
    console.log('✅ Fotos guardadas en base de datos exitosamente')

      return NextResponse.json({
        success: true,
        message: 'Fotos de tarea guardadas correctamente',
        tarea: updatedTarea,
        fotosCount: fotos.length
      })
    }
    
    // Ejecutar con timeout global
    return Promise.race([uploadPromise(), timeoutPromise])

  } catch (error) {
    console.error('❌ Error al subir fotos de tarea:', error)
    console.error('❌ Error stack:', error.stack)
    
    // Proporcionar más detalles del error
    let errorMessage = 'Error interno del servidor'
    let errorDetails = error.message
    let statusCode = 500
    
    if (error.message.includes('Request timeout')) {
      errorMessage = 'Timeout de la operación'
      errorDetails = 'La subida de fotos tardó demasiado tiempo'
      statusCode = 408
    } else if (error.message.includes('Timeout uploading photo')) {
      errorMessage = 'Timeout subiendo foto'
      errorDetails = 'Una foto específica tardó demasiado en subirse'
      statusCode = 408
    } else if (error.message.includes('Cloudinary')) {
      errorMessage = 'Error al subir fotos a Cloudinary'
      errorDetails = 'Problema con el servicio de almacenamiento de imágenes'
    } else if (error.message.includes('Sharp')) {
      errorMessage = 'Error al procesar las imágenes'
      errorDetails = 'Problema al comprimir las imágenes'
    } else if (error.message.includes('Prisma') || error.message.includes('database')) {
      errorMessage = 'Error al guardar en la base de datos'
      errorDetails = 'Problema al almacenar la información de las fotos'
    } else if (error.message.includes('demasiado grande')) {
      errorMessage = 'Archivo demasiado grande'
      errorDetails = error.message
      statusCode = 413
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        // Solo en desarrollo, mostrar stack completo
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: statusCode }
    )
  }
}
