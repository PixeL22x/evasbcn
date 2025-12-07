import { NextResponse } from 'next/server'
import { uploadImage } from '../../../../lib/cloudinary'

export async function POST(request) {
  try {
    console.log('🧪 Testing morning shift 4-photo upload...')
    
    // Simular el FormData del turno mañana con 4 fotos
    const testPhotos = [
      { tipo: 'cuaderno_apuntes', descripcion: 'Cuaderno de apuntes' },
      { tipo: 'ticket_tpv_1', descripcion: 'Ticket TPV 1' },
      { tipo: 'ticket_tpv_2', descripcion: 'Ticket TPV 2' },
      { tipo: 'datafono_detalle', descripcion: 'Datafono detalle operaciones' }
    ]
    
    // Crear imagen de prueba (1x1 pixel transparente)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hRXzSgAAAABJRU5ErkJggg=='
    const buffer = Buffer.from(testImageBase64, 'base64')
    
    console.log(`📤 Testing upload of ${testPhotos.length} photos...`)
    
    const results = []
    const errors = []
    
    // Simular subida paralela como en el código real
    const BATCH_SIZE = 3
    
    for (let i = 0; i < testPhotos.length; i += BATCH_SIZE) {
      const batch = testPhotos.slice(i, i + BATCH_SIZE)
      console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} photos`)
      
      const batchPromises = batch.map(async (foto, batchIndex) => {
        try {
          const fileName = `test_morning_${foto.tipo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const folder = 'evas-barcelona/test/morning'
          
          console.log(`🔄 Uploading ${foto.tipo}...`)
          const result = await uploadImage(buffer, fileName, folder)
          
          return {
            tipo: foto.tipo,
            descripcion: foto.descripcion,
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            timestamp: new Date()
          }
        } catch (error) {
          console.error(`❌ Error uploading ${foto.tipo}:`, error)
          throw error
        }
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, batchIndex) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
          console.log(`✅ Photo ${batch[batchIndex].tipo} uploaded successfully`)
        } else {
          errors.push({
            tipo: batch[batchIndex].tipo,
            error: result.reason.message
          })
          console.error(`❌ Error in photo ${batch[batchIndex].tipo}:`, result.reason)
        }
      })
    }
    
    console.log(`📊 Upload completed: ${results.length} successful, ${errors.length} failed`)
    
    return NextResponse.json({
      success: results.length > 0,
      message: `Morning shift photo test completed: ${results.length}/${testPhotos.length} photos uploaded`,
      results,
      errors,
      totalPhotos: testPhotos.length,
      successfulUploads: results.length,
      failedUploads: errors.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Morning photo test failed:', error)
    return NextResponse.json(
      { 
        error: 'Morning photo test failed', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    )
  }
}
