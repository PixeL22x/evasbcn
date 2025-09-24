import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Inicializar la base de datos en MongoDB
prisma.$connect().then(() => {
  console.log('✅ MongoDB connected successfully')
}).catch((error) => {
  console.error('❌ Error connecting to MongoDB:', error)
})
