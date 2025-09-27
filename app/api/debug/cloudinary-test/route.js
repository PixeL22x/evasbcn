import { NextResponse } from 'next/server'
import { uploadImage } from '../../../../lib/cloudinary'

// Configurar como ruta dinámica
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🔍 Verificando configuración de Cloudinary...')
    
    // Verificar variables de entorno
    const envVars = {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '***' : null
    }
    
    console.log('📋 Variables de entorno:', envVars)
    
    const missingVars = Object.entries(envVars)
      .filter(([key, value]) => !value || value === null)
      .map(([key]) => key)
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Variables de entorno faltantes',
        missing: missingVars,
        current: envVars
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Variables de entorno configuradas correctamente',
      cloudinaryConfig: envVars
    })
    
  } catch (error) {
    console.error('❌ Error verificando configuración:', error)
    return NextResponse.json({
      success: false,
      error: 'Error verificando configuración',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log('🧪 Probando subida a Cloudinary...')
    
    // Verificar variables de entorno primero
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Variables de entorno de Cloudinary no configuradas')
    }
    
    // Crear imagen de prueba muy pequeña (1x1 pixel)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hRXzSgAAAABJRU5ErkJggg=='
    const buffer = Buffer.from(testImageBase64, 'base64')
    
    console.log(`📤 Subiendo imagen de prueba (${buffer.length} bytes)...`)
    
    const startTime = Date.now()
    const result = await uploadImage(buffer, `cloudinary_test_${Date.now()}`, 'evas-barcelona/test')
    const uploadTime = Date.now() - startTime
    
    console.log(`✅ Subida exitosa en ${uploadTime}ms:`, result.secure_url)
    
    return NextResponse.json({
      success: true,
      message: 'Prueba de Cloudinary exitosa',
      uploadTime: `${uploadTime}ms`,
      result: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error en prueba de Cloudinary:', error)
    
    let errorType = 'unknown'
    if (error.message.includes('Invalid API key')) {
      errorType = 'invalid_api_key'
    } else if (error.message.includes('timeout')) {
      errorType = 'timeout'
    } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      errorType = 'network'
    } else if (error.message.includes('variables de entorno')) {
      errorType = 'missing_env_vars'
    }
    
    return NextResponse.json({
      success: false,
      error: 'Error en prueba de Cloudinary',
      errorType,
      details: error.message,
      stack: error.stack,
      cloudinaryConfig: {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET
      }
    }, { status: 500 })
  }
}
