// Configuración de la base de datos
export const DATABASE_CONFIG = {
  url: process.env.DATABASE_URL || "mongodb+srv://evas-user:EvasBarcelona2024!@evas-barcelona-cluster.txcyhmu.mongodb.net/evas-barcelona?retryWrites=true&w=majority&appName=evas-barcelona-cluster"
}

// Configuración de Cloudinary
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "tu-cloud-name",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "tickets_evas"
}
