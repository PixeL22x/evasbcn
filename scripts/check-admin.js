const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Connecting to database...')
        const admin = await prisma.trabajador.findFirst({
            where: { nombre: 'admin' }
        })

        if (admin) {
            console.log('✅ Admin user found:', admin)
        } else {
            console.log('❌ Admin user NOT found')
        }

        const count = await prisma.trabajador.count()
        console.log(`Total trabajadores: ${count}`)

    } catch (error) {
        console.error('❌ Database connection error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
