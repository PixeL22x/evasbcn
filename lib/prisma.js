import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Configuración de Prisma para SQLite
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Función para verificar la conexión
export async function connectDB() {
  try {
    await prisma.$connect()
    console.log('✅ SQLite connected successfully')
    return true
  } catch (error) {
    console.error('❌ Error connecting to SQLite:', error)
    return false
  }
}
