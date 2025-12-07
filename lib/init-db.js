import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function initializeDatabase() {
  try {
    // Verificar conexión
    await prisma.$connect()
    console.log('✅ MongoDB connected successfully')
    
    // Las colecciones se crean automáticamente en MongoDB cuando se inserta el primer documento
    // No necesitamos crear tablas como en SQL
    
    return true
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

















