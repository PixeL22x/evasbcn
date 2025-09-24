import { PrismaClient } from '@prisma/client'
import { DATABASE_CONFIG } from './config.js'

const globalForPrisma = globalThis

// Configuración de Prisma con URL hardcodeada temporalmente
export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_CONFIG.url
    }
  },
  log: ['query', 'info', 'warn', 'error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Función para verificar la conexión
export async function connectDB() {
  try {
    await prisma.$connect()
    console.log('✅ MongoDB connected successfully')
    return true
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error)
    return false
  }
}
