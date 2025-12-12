
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkStock() {
    const total = await prisma.producto.count()
    const active = await prisma.producto.count({ where: { activo: true } })
    const inactive = await prisma.producto.count({ where: { activo: false } })

    console.log(`Total Products: ${total}`)
    console.log(`Active Products: ${active}`)
    console.log(`Inactive Products: ${inactive}`)
}

checkStock()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
