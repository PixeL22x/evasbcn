const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Sembrando datos iniciales...')

  // Crear usuario administrador
  const admin = await prisma.trabajador.upsert({
    where: { nombre: 'admin' },
    update: {},
    create: {
      nombre: 'admin',
      password: 'admin123',
      activo: true,
    },
  })

  // Crear usuario trabajador de prueba
  const worker = await prisma.trabajador.upsert({
    where: { nombre: 'trabajador1' },
    update: {},
    create: {
      nombre: 'trabajador1',
      password: 'worker123',
      activo: true,
    },
  })

  console.log('✅ Datos iniciales creados:')
  console.log('   - Admin:', admin)
  console.log('   - Trabajador:', worker)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
