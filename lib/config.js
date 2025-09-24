// Configuración de la base de datos
export const DATABASE_CONFIG = {
  url: "file:./dev.db"
}

// Configuración de Cloudinary
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "tu-cloud-name",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "tickets_evas"
}
