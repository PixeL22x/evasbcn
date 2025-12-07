const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const productosEjemplo = [
  // Helados
  { nombre: 'Vainilla', categoria: 'helados', stock: 50, stockMinimo: 10, precio: 2.50 },
  { nombre: 'Chocolate', categoria: 'helados', stock: 45, stockMinimo: 10, precio: 2.50 },
  { nombre: 'Fresa', categoria: 'helados', stock: 40, stockMinimo: 10, precio: 2.50 },
  { nombre: 'Menta', categoria: 'helados', stock: 35, stockMinimo: 10, precio: 2.50 },
  { nombre: 'Cookies & Cream', categoria: 'helados', stock: 30, stockMinimo: 10, precio: 3.00 },
  { nombre: 'Dulce de Leche', categoria: 'helados', stock: 25, stockMinimo: 10, precio: 3.00 },
  { nombre: 'Limón', categoria: 'helados', stock: 3, stockMinimo: 10, precio: 2.50 }, // Stock bajo
  { nombre: 'Coco', categoria: 'helados', stock: 0, stockMinimo: 10, precio: 2.50 }, // Sin stock
  
  // Churros
  { nombre: 'Churros Clásicos', categoria: 'churros', stock: 100, stockMinimo: 20, precio: 1.50 },
  { nombre: 'Churros Rellenos', categoria: 'churros', stock: 80, stockMinimo: 20, precio: 2.00 },
  { nombre: 'Churros con Azúcar', categoria: 'churros', stock: 90, stockMinimo: 20, precio: 1.50 },
  
  // Toppings
  { nombre: 'Chocolate Caliente', categoria: 'toppings', stock: 30, stockMinimo: 5, precio: 0.50 },
  { nombre: 'Caramelo', categoria: 'toppings', stock: 25, stockMinimo: 5, precio: 0.50 },
  { nombre: 'Nueces', categoria: 'toppings', stock: 20, stockMinimo: 5, precio: 0.75 },
  { nombre: 'Oreo', categoria: 'toppings', stock: 15, stockMinimo: 5, precio: 0.75 },
  { nombre: 'Fresas', categoria: 'toppings', stock: 18, stockMinimo: 5, precio: 0.60 },
  
  // Conos
  { nombre: 'Cono Regular', categoria: 'conos', stock: 200, stockMinimo: 50, precio: 0.30 },
  { nombre: 'Cono Waffle', categoria: 'conos', stock: 150, stockMinimo: 30, precio: 0.50 },
  { nombre: 'Copa', categoria: 'conos', stock: 100, stockMinimo: 20, precio: 0.25 },
  
  // Bebidas
  { nombre: 'Coca Cola', categoria: 'bebidas', stock: 60, stockMinimo: 15, precio: 1.50 },
  { nombre: 'Agua', categoria: 'bebidas', stock: 40, stockMinimo: 10, precio: 1.00 },
  { nombre: 'Jugo de Naranja', categoria: 'bebidas', stock: 30, stockMinimo: 10, precio: 2.00 },
]

async function seedProductos() {
  try {
    console.log('🌱 Iniciando seed de productos...')
    
    // Verificar si ya existen productos
    const productosExistentes = await prisma.producto.count()
    if (productosExistentes > 0) {
      console.log('⚠️  Ya existen productos en la base de datos. Saltando seed.')
      return
    }
    
    // Crear productos
    for (const producto of productosEjemplo) {
      await prisma.producto.create({
        data: producto
      })
      console.log(`✅ Producto creado: ${producto.nombre}`)
    }
    
    console.log('🎉 Seed de productos completado exitosamente!')
    
  } catch (error) {
    console.error('❌ Error en seed de productos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedProductos()
