const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.configuracion.deleteMany({
    where: { clave: { startsWith: 'apertura_tasks_' } }
  })
  console.log('Eliminados:', result.count, 'registros de configuracion de apertura')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
