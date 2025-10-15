import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function GET() {
  try {
    // Crear una imagen de prueba pequeña
    const testImage = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .jpeg()
    .toBuffer()

    console.log('✅ Sharp funciona correctamente')
    
    return NextResponse.json({
      success: true,
      message: 'Sharp funciona correctamente',
      imageSize: testImage.length,
      sharpVersion: sharp.versions
    })
  } catch (error) {
    console.error('❌ Error con Sharp:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
