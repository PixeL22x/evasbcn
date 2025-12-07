const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Sembrando datos iniciales...')

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
