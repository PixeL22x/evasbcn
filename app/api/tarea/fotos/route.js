import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { uploadImage } from '../../../../lib/cloudinary'

export async function POST(request) {
  try {
    console.log('📸 Iniciando subida de fotos de tarea...')
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

    // Función para procesar una foto individual
    const procesarFoto = async (fotoData) => {
      const { file, tipo, descripcion, index } = fotoData
      
      try {
        console.log(`🔄 Procesando foto ${index + 1}/${fotosParaSubir.length}: ${tipo}`)
        
        // Convertir el archivo a buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Generar nombre único para la imagen
        const fileName = `tarea_${tareaId}_${tipo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const folder = `evas-barcelona/cierres/${cierreId}`
        
        // Subir a Cloudinary (con compresión automática)
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
        throw uploadError
      }
    }

    // Subir fotos en paralelo (máximo 3 a la vez para no sobrecargar)
    console.log('🚀 Iniciando subida paralela de fotos...')
    const BATCH_SIZE = 3
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

    // Actualizar la tarea para incluir las fotos subidas
    console.log('💾 Guardando fotos en base de datos...')
    const updatedTarea = await prisma.tarea.update({
      where: { id: tareaId },
      data: {
        fotosSubidas: JSON.stringify(fotos), // Almacenar las URLs de Cloudinary
      },
    })
    console.log('✅ Fotos guardadas en base de datos exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Fotos de tarea guardadas correctamente',
      tarea: updatedTarea,
      fotosCount: fotos.length
    })

  } catch (error) {
    console.error('❌ Error al subir fotos de tarea:', error)
    console.error('❌ Error stack:', error.stack)
    
    // Proporcionar más detalles del error
    let errorMessage = 'Error interno del servidor'
    let errorDetails = error.message
    
    if (error.message.includes('Cloudinary')) {
      errorMessage = 'Error al subir fotos a Cloudinary'
      errorDetails = 'Problema con el servicio de almacenamiento de imágenes'
    } else if (error.message.includes('Sharp')) {
      errorMessage = 'Error al procesar las imágenes'
      errorDetails = 'Problema al comprimir las imágenes'
    } else if (error.message.includes('Prisma') || error.message.includes('database')) {
      errorMessage = 'Error al guardar en la base de datos'
      errorDetails = 'Problema al almacenar la información de las fotos'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        // Solo en desarrollo, mostrar stack completo
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    )
  }
}
