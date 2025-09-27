import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

// Función para comprimir imagen con Sharp
export async function compressImage(imageBuffer, options = {}) {
  try {
    const {
      width = 1600,
      height = 1200,
      quality = 80,
      format = 'webp'
    } = options

    console.log(`🔄 Comprimiendo imagen: ${imageBuffer.length} bytes originales`)

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
    console.error('❌ Error comprimiendo imagen:', error)
    // Si falla la compresión, devolver imagen original
    return imageBuffer
  }
}

// Función para subir imagen (ahora con compresión)
export async function uploadImage(imageBuffer, fileName, folder = 'evas-barcelona') {
  try {
    // 1. Comprimir imagen antes de subir
    const compressedBuffer = await compressImage(imageBuffer, {
      width: 1600,
      height: 1200,
      quality: 80,
      format: 'webp'
    })

    // 2. Subir imagen comprimida a Cloudinary
    console.log(`☁️ Subiendo imagen comprimida a Cloudinary...`)
    const result = await cloudinary.uploader.upload(
      `data:image/webp;base64,${compressedBuffer.toString('base64')}`,
      {
        folder: folder,
        public_id: fileName,
        resource_type: 'image',
        // Ya no necesitamos transformaciones en Cloudinary porque Sharp ya optimizó
        transformation: [
          { quality: 'auto:good' }
        ]
      }
    )
    
    console.log(`✅ Imagen subida exitosamente: ${result.secure_url}`)
    return result
  } catch (error) {
    console.error('❌ Error uploading to Cloudinary:', error)
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
