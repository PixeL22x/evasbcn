async function main() {
    try {
        // 1. Create a temporary worker via direct DB (to have an ID)
        const { PrismaClient } = require('@prisma/client')
        const prisma = new PrismaClient()

        console.log('Creating temp worker for API test...')
        const worker = await prisma.trabajador.create({
            data: { nombre: 'API_Test_User', password: '123', activo: true }
        })
        console.log('Worker created:', worker.id)

        // 2. Call the API to update salarioHora
        console.log('Calling PUT API to update salarioHora...')
        const response = await fetch(`http://localhost:3000/api/trabajadores/${worker.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                salarioHora: 20.5,
                email: 'api_test@example.com'
            })
        })

        const data = await response.json()
        console.log('API Response Status:', response.status)

        // 3. Verify Response
        if (data.success && data.trabajador.salarioHora === 20.5) {
            console.log('✅ API SUCCESS: salarioHora updated correctly to', data.trabajador.salarioHora)
        } else {
            console.error('❌ API FAILED:', data)
        }

        // Cleanup
        await prisma.trabajador.delete({ where: { id: worker.id } })
        await prisma.$disconnect()

    } catch (error) {
        console.error('❌ Test failed:', error)
    }
}

// Wait for server to be ready? We'll run this manually after server start.
main()
