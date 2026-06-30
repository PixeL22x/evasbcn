const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

p.ticketDiario.findMany({
  where: { status: 'completado' },
  select: { items: true },
  take: 15,
  orderBy: { createdAt: 'desc' }
}).then(r => {
  const all = {}
  r.forEach(t => {
    if (!t.items) return
    t.items.forEach(i => {
      const nombre = (i.nombre || '').trim()
      const precio = i.precio || i.price || 0
      if (nombre && precio) {
        if (!all[nombre]) all[nombre] = []
        all[nombre].push(precio)
      }
    })
  })
  // Mostrar nombre → precios únicos
  Object.entries(all).sort().forEach(([n, precios]) => {
    const uniq = [...new Set(precios)]
    console.log(`${n}: ${uniq.join(', ')}`)
  })
  p.$disconnect()
}).catch(e => { console.error(e); p.$disconnect() })
