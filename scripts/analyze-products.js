const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('📊 Analizando productos existentes...\n')

    const productos = await prisma.producto.findMany({
        orderBy: [
            { categoria: 'asc' },
            { nombre: 'asc' }
        ]
    })

    // Agrupar por categoría
    const grouped = {}
    productos.forEach(p => {
        if (!grouped[p.categoria]) {
            grouped[p.categoria] = []
        }
        grouped[p.categoria].push({
            nombre: p.nombre,
            stock: p.stock,
            activo: p.activo
        })
    })

    // Mostrar resultados
    console.log('=== PRODUCTOS EXISTENTES POR CATEGORÍA ===\n')

    const categorias = Object.keys(grouped).sort()
    categorias.forEach(cat => {
        const prods = grouped[cat]
        const activos = prods.filter(p => p.activo).length
        console.log(`\n📦 ${cat.toUpperCase()} (${prods.length} productos, ${activos} activos):`)
        prods.forEach(p => {
            const status = p.activo ? '✅' : '❌'
            console.log(`   ${status} ${p.nombre} (stock: ${p.stock})`)
        })
    })

    console.log(`\n\n📈 RESUMEN:`)
    console.log(`   Total productos: ${productos.length}`)
    console.log(`   Activos: ${productos.filter(p => p.activo).length}`)
    console.log(`   Inactivos: ${productos.filter(p => !p.activo).length}`)
    console.log(`   Categorías: ${categorias.length}`)
    console.log(`\n📋 Categorías encontradas:`)
    categorias.forEach(cat => console.log(`   - ${cat}`))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
