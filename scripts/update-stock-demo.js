const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateStockDemo() {
  try {
    console.log('🔄 Actualizando productos para demo de colores...')
    
    // Buscar algunos productos para actualizar
    const productos = await prisma.producto.findMany({
      take: 5
    })
    
    if (productos.length === 0) {
      console.log('❌ No hay productos para actualizar')
      return
    }
    
    // Actualizar el primer producto para que tenga stock bajo
    await prisma.producto.update({
      where: { id: productos[0].id },
      data: { stock: 3, stockMinimo: 10 }
    })
    console.log(`✅ ${productos[0].nombre}: Stock bajo (3/10)`)
    
    // Actualizar el segundo producto para que no tenga stock
    if (productos[1]) {
      await prisma.producto.update({
        where: { id: productos[1].id },
        data: { stock: 0, stockMinimo: 10 }
      })
      console.log(`✅ ${productos[1].nombre}: Sin stock (0/10)`)
    }
    
    // Actualizar el tercer producto para que tenga stock normal
    if (productos[2]) {
      await prisma.producto.update({
        where: { id: productos[2].id },
        data: { stock: 25, stockMinimo: 10 }
      })
      console.log(`✅ ${productos[2].nombre}: Stock normal (25/10)`)
    }
    
    console.log('🎉 Demo de colores configurado!')
    console.log('Ahora verás:')
    console.log('- 🔴 Rojo: Sin stock')
    console.log('- 🟠 Naranja: Stock bajo')
    console.log('- 🟢 Verde: Stock normal')
    
  } catch (error) {
    console.error('❌ Error actualizando stock:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateStockDemo()




