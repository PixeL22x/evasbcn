
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export async function GET(request) {
    try {
        const mananaConfig = await prisma.configuracion.findUnique({
            where: { clave: 'cierre_tasks_mañana' }
        })

        const tardeConfig = await prisma.configuracion.findUnique({
            where: { clave: 'cierre_tasks_tarde' }
        })

        // Default tasks fallback
        const defaultTasks = {
            mañana: [
                {
                    nombre: '¿La pica está limpia?',
                    duracion: 1,
                },
                {
                    nombre: 'Fotos de Cuaderno apuntes, 2 fotos TPV y 1 foto datafono detalle operaciones',
                    duracion: 3,
                    requiereFotos: true,
                    fotosRequeridas: JSON.stringify([
                        { tipo: 'cuaderno_apuntes', descripcion: 'Cuaderno de apuntes' },
                        { tipo: 'ticket_tpv_1', descripcion: 'Ticket TPV 1' },
                        { tipo: 'ticket_tpv_2', descripcion: 'Ticket TPV 2' },
                        { tipo: 'datafono_detalle', descripcion: 'Datafono detalle operaciones' }
                    ])
                },
                {
                    nombre: 'Total de ventas del día',
                    duracion: 2,
                    requiereInput: true,
                    inputType: 'ventas'
                }
            ],
            tarde: [
                // 🧊 Bloque 1 - Preparación Inicial
                {
                    nombre: '🧊 Bloque 1 - Preparación Inicial',
                    duracion: 8,
                    subtareas: JSON.stringify([
                        'Preparar cubeta con agua + Fairy',
                        'Trapos cubo agua + lejía',
                        'Guardar cosas secas'
                    ])
                },
                // 🍦 Bloque 2 - Helados y Limpieza
                {
                    nombre: '🍦 Bloque 2 - Helados y Limpieza',
                    duracion: 12,
                    subtareas: JSON.stringify([
                        'Separar helados y quitar barras metálicas',
                        'Guardar smoothies + Milkshakes + Hielo Picado',
                        'Cerrar cajas de galletas',
                        'Barrer y aspirar'
                    ])
                },
                // 🪟 Bloque 3 - Cierre al Público
                {
                    nombre: '🪟 Bloque 3 - Cierre al Público',
                    duracion: 6,
                    subtareas: JSON.stringify([
                        'Meter carteles',
                        'Cerrar puerta',
                        'Apagar luces menos blancas'
                    ])
                },
                // ☂️ Confirmación Toldo
                {
                    nombre: '¿El toldo está cerrado correctamente?',
                    duracion: 1,
                },
                // 🍧 Bloque 4 - Organización Helados
                {
                    nombre: '🍧 Bloque 4 - Organización Helados',
                    duracion: 12,
                    subtareas: JSON.stringify([
                        'Sacar pinchos + cucharas',
                        'Tapar helados',
                        'Guardar helados Isa 1 hacia congelador enfrente blanco',
                        'Guardar helados Isa 2 congelador gris'
                    ])
                },
                // 🧴 Bloque 5 - Limpieza y Documentación
                {
                    nombre: '🧴 Bloque 5 - Limpieza y Documentación',
                    duracion: 5,
                    subtareas: JSON.stringify([
                        'Sacar pinchos y cucharas a secar',
                        'Sacar basura'
                    ])
                },
                // 📋 Bloque 5.1 - Apuntar Info Cierre
                {
                    nombre: '📋 Bloque 5.1 - Apuntar info cierre',
                    duracion: 3,
                    requiereFotos: true,
                    fotosRequeridas: JSON.stringify([
                        { tipo: 'cuaderno_apuntes', descripcion: 'Cuaderno de apuntes' },
                        { tipo: 'ticket_bbva', descripcion: 'Ticket BBVA' },
                        { tipo: 'ticket_caixa', descripcion: 'Ticket Caixa' }
                    ])
                },
                // 💰 Bloque 5.2 - Escanear Ticket de Ventas (con IA)
                {
                    nombre: '💰 Bloque 5.2 - Escanea el ticket de ventas del día',
                    duracion: 3,
                    requiereInput: true,
                    inputType: 'ventas',
                    requiereEscaneo: true
                },
                // 📸 Bloque 5.3 - Fotos Máquinas Apagadas
                {
                    nombre: '📸 Bloque 5.3 - Enviar fotos máquinas apagadas',
                    duracion: 2,
                    requiereFotos: true,
                    fotosRequeridas: JSON.stringify([
                        { tipo: 'crepera_apagada', descripcion: 'Crepera apagada' },
                        { tipo: 'waflera_apagada', descripcion: 'Waflera apagada' },
                        { tipo: 'aire_apagado', descripcion: 'Aire acondicionado apagado' },
                        { tipo: 'isa1_apagada', descripcion: 'ISA 1 apagada' },
                        { tipo: 'isa2_apagada', descripcion: 'ISA 2 apagada' }
                    ])
                },
                // 🌬️ Confirmación Ventiladores
                {
                    nombre: '¿Los ventiladores del techo están apagados?',
                    duracion: 1,
                },
                // ⚙️ Bloque 6 - Apagado de Equipos
                {
                    nombre: '⚙️ Bloque 6 - Apagado de Equipos',
                    duracion: 5,
                    subtareas: JSON.stringify([
                        'Apagar Just Eat y TPV',
                        'Apagar datáfonos y móvil, también cargarlos'
                    ])
                },
                // 🧽 Bloque 7 - Limpieza Final
                {
                    nombre: '🧽 Bloque 7 - Limpieza Final',
                    duracion: 7,
                    subtareas: JSON.stringify([
                        'Limpiar con esponja lugar de cucharas',
                        'Fregar + Escurrir fregona y tirar agua del cubo'
                    ])
                },
            ]
        }

        // Normalizar fotos para asegurar que todas tengan el campo 'activa'
        const normalizarFotos = (fotosString) => {
            if (!fotosString) return fotosString

            try {
                const fotos = JSON.parse(fotosString)
                if (!Array.isArray(fotos)) return fotosString

                const fotosNormalizadas = fotos.map(f => ({
                    ...f,
                    activa: f.activa !== undefined ? f.activa : true
                }))

                return JSON.stringify(fotosNormalizadas)
            } catch (e) {
                return fotosString
            }
        }

        // Normalizar tareas para asegurar que todas tengan el campo 'activa'
        const normalizarTareas = (tasks) => {
            if (!Array.isArray(tasks)) return []
            return tasks.map(t => ({
                ...t,
                activa: t.activa !== undefined ? t.activa : true, // Default: true
                fotosRequeridas: t.requiereFotos
                    ? normalizarFotos(t.fotosRequeridas)
                    : t.fotosRequeridas
            }))
        }

        return NextResponse.json({
            mañana: normalizarTareas(mananaConfig?.valor || defaultTasks.mañana),
            tarde: normalizarTareas(tardeConfig?.valor || defaultTasks.tarde)
        })
    } catch (error) {
        console.error('Error fetching tasks config:', error)
        return NextResponse.json({ error: 'Error fetching config' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const { turno, tasks } = await request.json()

        if (!turno || !tasks) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const configKey = `cierre_tasks_${turno}`

        await prisma.configuracion.upsert({
            where: { clave: configKey },
            update: { valor: tasks },
            create: { clave: configKey, valor: tasks }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error saving tasks config:', error)
        return NextResponse.json({ error: 'Error saving config' }, { status: 500 })
    }
}
