
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const clave = searchParams.get('clave')

        if (clave) {
            const config = await prisma.configuracion.findUnique({
                where: { clave }
            })
            return NextResponse.json(config ? config.valor : null)
        }

        const configs = await prisma.configuracion.findMany()
        return NextResponse.json(configs)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { clave, valor } = body

        if (!clave || valor === undefined) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
        }

        const config = await prisma.configuracion.upsert({
            where: { clave },
            update: { valor },
            create: { clave, valor }
        })

        return NextResponse.json(config)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
