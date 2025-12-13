const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Productos organizados según las categorías EXISTENTES en la base de datos
// Categorías actuales: bebidas, churros, conos, helados, otros, toppings
const productos = [
    // ============ BEBIDAS ============
    { nombre: 'Coca Cola Normal', categoria: 'bebidas', stock: 0, stockMinimo: 10 },
    { nombre: 'Coca Cola Zero', categoria: 'bebidas', stock: 0, stockMinimo: 10 },
    { nombre: 'Fanta Naranja', categoria: 'bebidas', stock: 0, stockMinimo: 10 },
    { nombre: 'Agua con Gas', categoria: 'bebidas', stock: 0, stockMinimo: 10 },

    // ============ TOPPINGS (ingredientes dulces para helados/postres) ============
    { nombre: 'Galletas Oreo', categoria: 'toppings', stock: 0, stockMinimo: 3 },
    { nombre: 'Galletas Lotus', categoria: 'toppings', stock: 0, stockMinimo: 3 },
    { nombre: 'Lacasitos', categoria: 'toppings', stock: 0, stockMinimo: 2 },
    { nombre: 'Ositos Gominola', categoria: 'toppings', stock: 0, stockMinimo: 2 },
    { nombre: 'Chispas de Colores', categoria: 'toppings', stock: 0, stockMinimo: 2 },
    { nombre: 'Chispas Redondas de Colores', categoria: 'toppings', stock: 0, stockMinimo: 2 },
    { nombre: 'Mini Nubes', categoria: 'toppings', stock: 0, stockMinimo: 2 },
    { nombre: 'Nubes Azules', categoria: 'toppings', stock: 0, stockMinimo: 2 },
    { nombre: 'Granola', categoria: 'toppings', stock: 0, stockMinimo: 2 },
    { nombre: 'Muesli', categoria: 'toppings', stock: 0, stockMinimo: 2 },
    { nombre: 'Coco Rallado', categoria: 'toppings', stock: 0, stockMinimo: 2 },
    { nombre: 'Semillas Chía', categoria: 'toppings', stock: 0, stockMinimo: 2 },
    { nombre: 'Semillas Girasol', categoria: 'toppings', stock: 0, stockMinimo: 2 },

    // ============ OTROS (ingredientes, café, infusiones, envases, limpieza) ============
    // Ingredientes secos
    { nombre: 'Leche en Polvo', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Cacao en Polvo', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Canela', categoria: 'otros', stock: 0, stockMinimo: 1 },
    { nombre: 'Miel', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Matcha', categoria: 'otros', stock: 0, stockMinimo: 1 },
    { nombre: 'Chai', categoria: 'otros', stock: 0, stockMinimo: 1 },
    { nombre: 'Azúcar', categoria: 'otros', stock: 0, stockMinimo: 5 },
    { nombre: 'Edulcorante', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Crema de Cacahuete', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Impulsor (Levadura)', categoria: 'otros', stock: 0, stockMinimo: 2 },

    // Infusiones y Café
    { nombre: 'Manzanilla', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Rooibos', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Té Negro', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Cápsulas Café', categoria: 'otros', stock: 0, stockMinimo: 20 },
    { nombre: 'Cápsulas Café Descafeinado', categoria: 'otros', stock: 0, stockMinimo: 10 },
    { nombre: 'Café Molido Tienda', categoria: 'otros', stock: 0, stockMinimo: 2 },

    // Envases y Utensilios
    { nombre: 'Cucharas Madera', categoria: 'otros', stock: 0, stockMinimo: 50 },
    { nombre: 'Tenedores Madera', categoria: 'otros', stock: 0, stockMinimo: 50 },
    { nombre: 'Cuchillos Madera', categoria: 'otros', stock: 0, stockMinimo: 50 },
    { nombre: 'Cucharitas Helado', categoria: 'otros', stock: 0, stockMinimo: 100 },
    { nombre: 'Palitos para Probar', categoria: 'otros', stock: 0, stockMinimo: 100 },
    { nombre: 'Platos Crepes', categoria: 'otros', stock: 0, stockMinimo: 30 },
    { nombre: 'Platos Gofres', categoria: 'otros', stock: 0, stockMinimo: 30 },
    { nombre: 'Platos Pasteles', categoria: 'otros', stock: 0, stockMinimo: 30 },
    { nombre: 'Bolsas Galletas', categoria: 'otros', stock: 0, stockMinimo: 50 },
    { nombre: 'Bolsas Genéricas', categoria: 'otros', stock: 0, stockMinimo: 50 },
    { nombre: 'Vasos Plástico L', categoria: 'otros', stock: 0, stockMinimo: 50 },
    { nombre: 'Vasos Plástico S', categoria: 'otros', stock: 0, stockMinimo: 50 },
    { nombre: 'Tapas Vasos Plástico L', categoria: 'otros', stock: 0, stockMinimo: 50 },
    { nombre: 'Pajitas', categoria: 'otros', stock: 0, stockMinimo: 100 },
    { nombre: 'Vasos Café L', categoria: 'otros', stock: 0, stockMinimo: 50 },
    { nombre: 'Vasos Café S', categoria: 'otros', stock: 0, stockMinimo: 50 },
    { nombre: 'Tapas Vasos Café L', categoria: 'otros', stock: 0, stockMinimo: 50 },
    { nombre: 'Tapas Vasos Café S', categoria: 'otros', stock: 0, stockMinimo: 50 },
    { nombre: 'Porta Vasos', categoria: 'otros', stock: 0, stockMinimo: 20 },
    { nombre: 'Servilletas', categoria: 'otros', stock: 0, stockMinimo: 100 },
    { nombre: 'Bolsas Triangulares Churros', categoria: 'otros', stock: 0, stockMinimo: 50 },

    // Limpieza
    { nombre: 'Lejía', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Friegasuelos', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Jabón Platos', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Limpiador Tuberías', categoria: 'otros', stock: 0, stockMinimo: 1 },
    { nombre: 'Quitagrasas', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Limpia Cristales', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Desinfectante Multiusos', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Estropajo', categoria: 'otros', stock: 0, stockMinimo: 5 },
    { nombre: 'Mocho', categoria: 'otros', stock: 0, stockMinimo: 2 },
    { nombre: 'Trapos', categoria: 'otros', stock: 0, stockMinimo: 10 },
    { nombre: 'Bolsas Basura 30L', categoria: 'otros', stock: 0, stockMinimo: 20 },
    { nombre: 'Bolsas Basura 100L', categoria: 'otros', stock: 0, stockMinimo: 10 },
    { nombre: 'Cápsulas Jabón Lavadora', categoria: 'otros', stock: 0, stockMinimo: 10 },
    { nombre: 'Papel Higiénico', categoria: 'otros', stock: 0, stockMinimo: 10 },
    { nombre: 'Papel Cocina', categoria: 'otros', stock: 0, stockMinimo: 5 },
    { nombre: 'Jabón para Manos', categoria: 'otros', stock: 0, stockMinimo: 3 },
]

async function main() {
    console.log('🚀 Iniciando registro de productos...\n')
    console.log('📋 Usando categorías existentes: bebidas, churros, conos, helados, otros, toppings\n')

    let creados = 0
    let existentes = 0
    let errores = 0

    for (const producto of productos) {
        try {
            await prisma.producto.create({
                data: {
                    nombre: producto.nombre,
                    categoria: producto.categoria,
                    stock: producto.stock,
                    stockMinimo: producto.stockMinimo,
                    activo: true
                }
            })
            console.log(`✅ Creado: ${producto.nombre} (${producto.categoria})`)
            creados++
        } catch (error) {
            if (error.code === 'P2002') {
                console.log(`⚠️  Ya existe: ${producto.nombre}`)
                existentes++
            } else {
                console.log(`❌ Error en ${producto.nombre}:`, error.message)
                errores++
            }
        }
    }

    console.log('\n📊 RESUMEN:')
    console.log(`   ✅ Productos creados: ${creados}`)
    console.log(`   ⚠️  Ya existían: ${existentes}`)
    console.log(`   ❌ Errores: ${errores}`)
    console.log(`   📦 Total procesados: ${productos.length}`)

    console.log('\n📈 DISTRIBUCIÓN POR CATEGORÍA:')
    const porCategoria = {}
    productos.forEach(p => {
        porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + 1
    })
    Object.keys(porCategoria).sort().forEach(cat => {
        console.log(`   ${cat}: ${porCategoria[cat]} productos`)
    })
}

main()
    .catch((e) => {
        console.error('💥 Error fatal:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
