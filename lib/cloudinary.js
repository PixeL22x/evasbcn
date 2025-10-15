import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

// Función para comprimir imagen con Sharp (optimizada para móviles)
export async function compressImage(imageBuffer, options = {}) {
  try {
    const {
      maxWidth = 1200,
      maxHeight = 800,
      quality = 70,
      format = 'jpeg'
    } = options

    console.log(`🔄 Comprimiendo imagen: ${imageBuffer.length} bytes originales`)

    // Verificar si Sharp está disponible
    if (!sharp) {
      console.warn('⚠️ Sharp no disponible, usando imagen original')
      return imageBuffer
    }

    const compressedBuffer = await sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .rotate() // Auto-rotar basado en EXIF
      .jpeg({ 
        quality,
        progressive: true,
        mozjpeg: true // Mejor compresión JPEG
      })
      .toBuffer()

    const reductionPercent = Math.round((1 - compressedBuffer.length / imageBuffer.length) * 100)
    console.log(`✅ Imagen comprimida: ${compressedBuffer.length} bytes (${reductionPercent}% reducción)`)

    return compressedBuffer
  } catch (error) {
    console.error('❌ Error comprimiendo imagen con Sharp:', error)
    console.log('🔄 Usando imagen original como fallback')
    return imageBuffer
  }
}

// Función para subir imagen (mejorada con compresión automática)
export async function uploadImage(imageBuffer, fileName, folder = 'evas-barcelona') {
  try {
    console.log(`🔍 Imagen original: ${imageBuffer.length} bytes`)
    
    // Verificar variables de entorno
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary environment variables not configured')
    }

    // Validar tamaño del buffer
    if (imageBuffer.length === 0) {
      throw new Error('Image buffer is empty')
    }

    // Comprimir SIEMPRE antes de subir (doble compresión para máxima eficiencia)
    const compressedBuffer = await compressImage(imageBuffer, {
      maxWidth: 1200,
      maxHeight: 800,
      quality: 70
    })
    
    console.log(`📦 Imagen comprimida: ${compressedBuffer.length} bytes`)

    // Configurar timeout para la subida individual
    const uploadTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cloudinary upload timeout after 60 seconds')), 60000)
    })

    const uploadPromise = cloudinary.uploader.upload(
      `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`,
      {
        folder: folder,
        public_id: fileName,
        resource_type: 'image',
        timeout: 60000, // Timeout interno de Cloudinary (60 segundos)
        chunk_size: 6000000, // 6MB chunks para archivos grandes
        quality: 'auto', // Cloudinary también optimiza
        fetch_format: 'auto'
      }
    )

    // Ejecutar con timeout
    console.log(`☁️ Subiendo imagen a Cloudinary...`)
    const result = await Promise.race([uploadPromise, uploadTimeoutPromise])
    
    console.log(`✅ Imagen subida exitosamente: ${result.secure_url}`)
    return result
  } catch (error) {
    console.error('❌ Error uploading to Cloudinary:', error)
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      bufferSize: imageBuffer?.length || 'unknown',
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
