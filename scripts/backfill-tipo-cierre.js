const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Usar runCommandRaw para ejecutar MongoDB nativo
  // Actualiza todos los documentos donde 'tipo' no existe o es null
  const result = await prisma.$runCommandRaw({
    update: 'Cierre',
    updates: [
      {
        q: { $or: [{ tipo: { $exists: false } }, { tipo: null }] },
        u: { $set: { tipo: 'cierre' } },
        multi: true
      }
    ]
  })
  console.log('✅ Resultado:', JSON.stringify(result))
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
