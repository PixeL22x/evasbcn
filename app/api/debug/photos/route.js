import { NextResponse } from 'next/server'
import { uploadImage } from '../../../../lib/cloudinary'

export async function GET() {
  try {
    console.log('🔍 Diagnostic check started...')
    
    // Check environment variables
    const envCheck = {
      CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL
    }
    
    console.log('📋 Environment variables:', envCheck)
    
    return NextResponse.json({
      success: true,
      environment: envCheck,
      timestamp: new Date().toISOString(),
      message: 'Diagnostic endpoint working'
    })
  } catch (error) {
    console.error('❌ Diagnostic error:', error)
    return NextResponse.json(
      { 
        error: 'Diagnostic failed', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    console.log('🧪 Testing photo upload...')
    
    // Create a simple test image buffer (1x1 transparent PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hRXzSgAAAABJRU5ErkJggg=='
    const buffer = Buffer.from(testImageBase64, 'base64')
    
    console.log('📤 Uploading test image...')
    const result = await uploadImage(buffer, `test_vercel_${Date.now()}`, 'evas-barcelona/test')
    
    return NextResponse.json({
      success: true,
      message: 'Photo upload test successful',
      cloudinary: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Photo upload test failed:', error)
    return NextResponse.json(
      { 
        error: 'Photo upload test failed', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    )
  }
}
