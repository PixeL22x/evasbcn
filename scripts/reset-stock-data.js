
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetStock() {
    console.log('Starting stock reset...')

    // 1. Delete all movement history
    const deletedMovements = await prisma.movimientoStock.deleteMany({})
    console.log(`Deleted ${deletedMovements.count} movement records.`)

    // 2. Reset stock to 0 for all products
    const updatedProducts = await prisma.producto.updateMany({
        data: { stock: 0 }
    })
    console.log(`Reset stock to 0 for ${updatedProducts.count} products.`)

    console.log('Stock reset complete.')
}

resetStock()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
