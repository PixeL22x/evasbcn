import { NextResponse } from 'next/server'
import { uploadImage } from '../../../../lib/cloudinary'

// Configurar como ruta dinámica
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🧪 Simulando subida de 4 fotos del turno mañana...')
    
    // Simular exactamente las 4 fotos del paso problemático
    const fotosRequeridas = [
      { tipo: 'cuaderno_apuntes', descripcion: 'Cuaderno de apuntes' },
      { tipo: 'ticket_tpv_1', descripcion: 'Ticket TPV 1' },
      { tipo: 'ticket_tpv_2', descripcion: 'Ticket TPV 2' },
      { tipo: 'datafono_detalle', descripcion: 'Datafono detalle operaciones' }
    ]
    
    // Crear imagen de prueba (simulando una foto de móvil pequeña)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hRXzSgAAAABJRU5ErkJggg=='
    const buffer = Buffer.from(testImageBase64, 'base64')
    
    console.log(`📊 Iniciando simulación: ${fotosRequeridas.length} fotos`)
    const startTime = Date.now()
    
    // Simular el mismo proceso que en el código real
    const BATCH_SIZE = 3
    const fotos = []
    const errors = []
    
    for (let i = 0; i < fotosRequeridas.length; i += BATCH_SIZE) {
      const batch = fotosRequeridas.slice(i, i + BATCH_SIZE)
      console.log(`📦 Procesando lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} fotos`)
      
      const batchPromises = batch.map(async (foto, batchIndex) => {
        try {
          const fileName = `morning_test_${foto.tipo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const folder = 'evas-barcelona/test/morning'
          
          console.log(`🔄 Subiendo ${foto.tipo}...`)
          const photoStartTime = Date.now()
          
          const result = await uploadImage(buffer, fileName, folder)
          const photoUploadTime = Date.now() - photoStartTime
          
          console.log(`✅ ${foto.tipo} subida en ${photoUploadTime}ms`)
          
          return {
            tipo: foto.tipo,
            descripcion: foto.descripcion,
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            uploadTime: photoUploadTime,
            timestamp: new Date()
          }
        } catch (error) {
          console.error(`❌ Error subiendo ${foto.tipo}:`, error)
          throw { tipo: foto.tipo, error: error.message }
        }
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, batchIndex) => {
        if (result.status === 'fulfilled') {
          fotos.push(result.value)
        } else {
          errors.push(result.reason)
        }
      })
    }
    
    const totalTime = Date.now() - startTime
    
    console.log(`📊 Simulación completada en ${totalTime}ms: ${fotos.length} éxito, ${errors.length} errores`)
    
    const success = fotos.length === fotosRequeridas.length && errors.length === 0
    
    return NextResponse.json({
      success,
      message: success 
        ? 'Simulación del turno mañana exitosa' 
        : `Simulación falló: ${errors.length} errores de ${fotosRequeridas.length} fotos`,
      stats: {
        totalPhotos: fotosRequeridas.length,
        successfulUploads: fotos.length,
        failedUploads: errors.length,
        totalTime: `${totalTime}ms`,
        averageTimePerPhoto: fotos.length > 0 ? `${Math.round(totalTime / fotos.length)}ms` : 'N/A'
      },
      results: fotos,
      errors,
      environment: {
        cloudinary_configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
        vercel_env: process.env.VERCEL_ENV || 'development'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error en simulación del turno mañana:', error)
    return NextResponse.json({
      success: false,
      error: 'Error en simulación del turno mañana',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
