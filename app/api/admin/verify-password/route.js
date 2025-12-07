
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request) {
    try {
        const { password } = await request.json()

        if (!password) {
            return NextResponse.json({ valid: false, error: 'Password required' }, { status: 400 })
        }

        // Buscar al usuario 'admin' (hardcoded porque esta es una funcion especifica de admin)
        const adminUser = await prisma.trabajador.findUnique({
            where: { nombre: 'admin' }
        })

        if (!adminUser) {
            console.error('Admin user not found in DB')
            return NextResponse.json({ valid: false, error: 'Admin not found' }, { status: 404 })
        }

        // Verificar contraseña
        const isValid = await bcrypt.compare(password, adminUser.password)

        if (isValid) {
            return NextResponse.json({ valid: true })
        } else {
            return NextResponse.json({ valid: false })
        }

    } catch (error) {
        console.error('Error verifying password:', error)
        return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 })
    }
}
