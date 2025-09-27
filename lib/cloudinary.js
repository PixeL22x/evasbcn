import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

// Función para comprimir imagen con Sharp (con fallback para Vercel)
export async function compressImage(imageBuffer, options = {}) {
  try {
    const {
      width = 1600,
      height = 1200,
      quality = 80,
      format = 'webp'
    } = options

    console.log(`🔄 Comprimiendo imagen: ${imageBuffer.length} bytes originales`)

    // Verificar si Sharp está disponible (puede fallar en algunos entornos serverless)
    if (!sharp) {
      console.warn('⚠️ Sharp no disponible, usando imagen original')
      return imageBuffer
    }

    const compressedBuffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .rotate() // Auto-rotar basado en EXIF
      .removeMetadata() // Quitar EXIF para reducir tamaño
      [format]({ quality })
      .toBuffer()

    console.log(`✅ Imagen comprimida: ${compressedBuffer.length} bytes (${Math.round((1 - compressedBuffer.length / imageBuffer.length) * 100)}% reducción)`)

    return compressedBuffer
  } catch (error) {
    console.error('❌ Error comprimiendo imagen con Sharp:', error)
    console.log('🔄 Usando imagen original como fallback')
    // Si falla la compresión, devolver imagen original
    return imageBuffer
  }
}

// Función para subir imagen (ahora con compresión y fallback)
export async function uploadImage(imageBuffer, fileName, folder = 'evas-barcelona') {
  try {
    console.log(`🔍 Iniciando subida de imagen: ${imageBuffer.length} bytes`)
    
    // Verificar variables de entorno
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary environment variables not configured')
    }

    let finalBuffer = imageBuffer
    let mimeType = 'image/jpeg' // Default
    
    try {
      // 1. Intentar comprimir imagen antes de subir
      const compressedBuffer = await compressImage(imageBuffer, {
        width: 1600,
        height: 1200,
        quality: 80,
        format: 'webp'
      })
      
      if (compressedBuffer !== imageBuffer) {
        finalBuffer = compressedBuffer
        mimeType = 'image/webp'
        console.log(`✅ Imagen comprimida exitosamente`)
      }
    } catch (compressionError) {
      console.warn('⚠️ Compresión falló, usando imagen original:', compressionError.message)
      // Continuar con imagen original
    }

    // 2. Subir imagen a Cloudinary
    console.log(`☁️ Subiendo imagen a Cloudinary...`)
    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${finalBuffer.toString('base64')}`,
      {
        folder: folder,
        public_id: fileName,
        resource_type: 'image',
        transformation: [
          { width: 1600, height: 1200, crop: 'limit' },
          { quality: 'auto:good' },
          { format: 'webp' }
        ]
      }
    )
    
    console.log(`✅ Imagen subida exitosamente: ${result.secure_url}`)
    return result
  } catch (error) {
    console.error('❌ Error uploading to Cloudinary:', error)
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      cloudinaryConfig: {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET
      }
    })
    throw error
  }
}

// Función para eliminar imagen
export async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    throw error
  }
}
