/**
 * Utilidades de compresión de imágenes para móviles
 * Optimizado para fotos de tickets y máquinas apagadas
 */

// Configuración de compresión
export const COMPRESSION_CONFIG = {
  // Objetivo: máximo 2MB por foto
  maxSizeKB: 2048,

  // Dimensiones máximas (mantiene aspect ratio) - Aumentado para mejor OCR
  maxWidth: 2000,
  maxHeight: 2000,

  // Calidad JPEG inicial - Alta calidad para mejor lectura de texto
  initialQuality: 0.95,

  // Calidad mínima antes de reducir dimensiones
  minQuality: 0.1,

  // Formato de salida
  format: 'image/jpeg'
}

/**
 * Comprime una imagen automáticamente hasta alcanzar el tamaño objetivo
 * @param {File} file - Archivo de imagen original
 * @param {number} maxSizeKB - Tamaño máximo en KB (opcional)
 * @returns {Promise<Blob>} - Imagen comprimida
 */
export const compressImageForUpload = async (file, maxSizeKB = COMPRESSION_CONFIG.maxSizeKB) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        try {
          // Calcular dimensiones manteniendo aspect ratio
          const { maxWidth, maxHeight } = COMPRESSION_CONFIG
          let { width, height } = img

          // Redimensionar si es necesario
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }

          canvas.width = width
          canvas.height = height

          // Dibujar imagen redimensionada con mejor calidad
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          // Función recursiva para comprimir con calidad adaptativa
          const compress = (quality = COMPRESSION_CONFIG.initialQuality) => {
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Error al comprimir la imagen'))
                return
              }

              const sizeKB = blob.size / 1024

              // Si el tamaño es aceptable o llegamos al mínimo de calidad
              if (sizeKB <= maxSizeKB || quality <= COMPRESSION_CONFIG.minQuality) {
                console.log(`📦 Compresión completada: ${Math.round(file.size / 1024 / 1024)}MB → ${Math.round(sizeKB / 1024)}MB (calidad: ${Math.round(quality * 100)}%)`)
                resolve(blob)
              } else {
                // Reducir calidad y intentar de nuevo
                const newQuality = Math.max(quality - 0.1, COMPRESSION_CONFIG.minQuality)
                compress(newQuality)
              }
            }, COMPRESSION_CONFIG.format, quality)
          }

          compress()
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'))
      }

      img.src = URL.createObjectURL(file)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Valida y comprime una foto automáticamente
 * @param {File} file - Archivo de imagen
 * @returns {Promise<File>} - Archivo comprimido o original si ya es pequeño
 */
export const validateAndCompressPhoto = async (file) => {
  const MAX_SIZE_MB = COMPRESSION_CONFIG.maxSizeKB / 1024
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

  console.log(`📸 Procesando foto: ${Math.round(file.size / 1024 / 1024)}MB`)

  // Si ya es pequeña, no comprimir
  if (file.size <= MAX_SIZE_BYTES) {
    console.log(`✅ Foto ya es pequeña, no necesita compresión`)
    return file
  }

  try {
    // Comprimir la imagen
    const compressedBlob = await compressImageForUpload(file)

    // Convertir Blob a File manteniendo el nombre original
    const compressedFile = new File([compressedBlob], file.name, {
      type: COMPRESSION_CONFIG.format,
      lastModified: Date.now()
    })

    console.log(`✅ Compresión exitosa: ${Math.round(file.size / 1024 / 1024)}MB → ${Math.round(compressedFile.size / 1024 / 1024)}MB`)

    return compressedFile
  } catch (error) {
    console.error('❌ Error comprimiendo foto:', error)
    // Si falla la compresión, devolver archivo original
    return file
  }
}

/**
 * Obtiene información detallada de una imagen
 * @param {File} file - Archivo de imagen
 * @returns {Promise<Object>} - Información de la imagen
 */
export const getImageInfo = async (file) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        sizeMB: Math.round(file.size / 1024 / 1024 * 100) / 100,
        aspectRatio: img.width / img.height,
        needsCompression: file.size > (COMPRESSION_CONFIG.maxSizeKB * 1024)
      })
    }
    img.onerror = () => {
      resolve({
        width: 0,
        height: 0,
        sizeMB: Math.round(file.size / 1024 / 1024 * 100) / 100,
        aspectRatio: 1,
        needsCompression: file.size > (COMPRESSION_CONFIG.maxSizeKB * 1024)
      })
    }
    img.src = URL.createObjectURL(file)
  })
}
