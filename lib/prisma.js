import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Configuración de Prisma para MongoDB
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
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
