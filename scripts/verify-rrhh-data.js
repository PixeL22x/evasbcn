const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Starting RRHH Data Verification...')
    let workerId = null

    try {
        // 1. Create Test Worker
        console.log('\n1️⃣ Creating Test Worker...')
        const worker = await prisma.trabajador.create({
            data: {
                nombre: 'TestWorker_RRHH_Verify',
                password: 'hash_placeholder',
                activo: true,
                cargo: 'tester'
            }
        })
        workerId = worker.id
        console.log('✅ Created Worker:', worker.id)

        // 2. Update HR Fields (The new fields)
        console.log('\n2️⃣ Updating Private HR Data...')
        const updatedWorker = await prisma.trabajador.update({
            where: { id: workerId },
            data: {
                email: 'test@rrhh.com',
                telefono: '555-000-111',
                direccion: 'Calle Test 123',
                dni: '12345678X',
                nss: 'NSS-999',
                iban: 'ES00-0000-0000',
                salarioHora: 15.50,
                notasAdmin: 'Verified by script'
            }
        })

        // Validate fields
        if (updatedWorker.email === 'test@rrhh.com' && updatedWorker.salarioHora === 15.50) {
            console.log('✅ HR Fields Updated Successfully')
        } else {
            throw new Error('HR Fields verification failed')
        }

        // 3. Create Document
        console.log('\n3️⃣ Creating Test Document record...')
        const doc = await prisma.documento.create({
            data: {
                nombre: 'contrato_test.pdf',
                url: 'https://cloudinary.com/dummy/url',
                tipo: 'pdf',
                categoria: 'contrato',
                trabajadorId: workerId
            }
        })
        console.log('✅ Document Created:', doc.id)

        // 4. List Documents
        console.log('\n4️⃣ Fetching Worker Documents...')
        const docs = await prisma.documento.findMany({
            where: { trabajadorId: workerId }
        })
        if (docs.length > 0) {
            console.log(`✅ Found ${docs.length} document(s)`)
        } else {
            throw new Error('Document listing failed')
        }

        // 5. Cleanup
        console.log('\n5️⃣ Cleaning up test data...')
        await prisma.documento.deleteMany({ where: { trabajadorId: workerId } })
        await prisma.trabajador.delete({ where: { id: workerId } })
        console.log('✅ Cleanup Complete')

        console.log('\n🎉 ALL CHECKS PASSED: The RRHH Data Schema and Client are fully functional.')

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error)
    } finally {
        if (workerId) {
            // Ensure cleanup in case of error mid-way
            try {
                await prisma.documento.deleteMany({ where: { trabajadorId: workerId } })
                await prisma.trabajador.delete({ where: { id: workerId } })
            } catch (e) { }
        }
        await prisma.$disconnect()
    }
}

main()
