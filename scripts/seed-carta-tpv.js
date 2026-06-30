/**
 * Seed script: crea la carta completa del TPV de Evas Barcelona
 * con precios extraídos de los tickets escaneados reales.
 *
 * Ejecutar: node scripts/seed-carta-tpv.js
 */

const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

const carta = [
  // ─── HELADOS ────────────────────────────────────────────────────────────────
  { nombre: '1 Bola',              categoria: 'helados',  precio: 3.90, emoji: '🍦', orden: 1 },
  { nombre: '2 Bolas',             categoria: 'helados',  precio: 5.50, emoji: '🍦', orden: 2 },
  { nombre: '3 Bolas',             categoria: 'helados',  precio: 6.70, emoji: '🍦', orden: 3 },
  { nombre: '4 Bolas',             categoria: 'helados',  precio: 7.90, emoji: '🍦', orden: 4 },
  { nombre: 'Bola Waffle/Crep',    categoria: 'helados',  precio: 2.80, emoji: '🧇', orden: 5 },
  { nombre: '1/2 Kilo',            categoria: 'helados',  precio: 15.80, emoji: '📦', orden: 6 },
  { nombre: 'Caja S Galleta',      categoria: 'helados',  precio: 6.00, emoji: '📦', orden: 7 },
  { nombre: 'Caja L',              categoria: 'helados',  precio: 18.00, emoji: '📦', orden: 8 },
  { nombre: 'Cono',                categoria: 'helados',  precio: 0.30, emoji: '🍦', orden: 9 },
  { nombre: 'Empleado 1 Bola',     categoria: 'helados',  precio: 2.00, emoji: '🍦', orden: 10 },

  // ─── GOFRES & CHURROS ───────────────────────────────────────────────────────
  { nombre: 'Gofre 1 Topping',     categoria: 'churros',  precio: 5.80, emoji: '🧇', orden: 1 },
  { nombre: '4 Xurros',            categoria: 'churros',  precio: 4.50, emoji: '🥐', orden: 2 },
  { nombre: '5 Xurros',            categoria: 'churros',  precio: 5.50, emoji: '🥐', orden: 3 },
  { nombre: 'Xurro Adicional',     categoria: 'churros',  precio: 1.00, emoji: '🥐', orden: 4 },

  // ─── AÇAÍ BOWLS ─────────────────────────────────────────────────────────────
  { nombre: 'Acai Classic - S',    categoria: 'postres',  precio: 5.90, emoji: '🫐', orden: 1 },
  { nombre: 'Acai Classic - L',    categoria: 'postres',  precio: 8.50, emoji: '🫐', orden: 2 },
  { nombre: 'Acai Custom - S',     categoria: 'postres',  precio: 5.90, emoji: '🫐', orden: 3 },
  { nombre: 'Acai Custom - L',     categoria: 'postres',  precio: 8.50, emoji: '🫐', orden: 4 },
  { nombre: 'Acai Power - S',      categoria: 'postres',  precio: 5.90, emoji: '🫐', orden: 5 },
  { nombre: 'Extra Topping Açai',  categoria: 'postres',  precio: 0.50, emoji: '➕', orden: 6 },
  { nombre: 'Fruta Extra',         categoria: 'postres',  precio: 1.00, emoji: '🍓', orden: 7 },

  // ─── SMOOTHIES & MILKSHAKES ──────────────────────────────────────────────────
  { nombre: 'Smoothie Açai Boost', categoria: 'bebidas',  precio: 6.00, emoji: '🥤', orden: 1 },
  { nombre: 'Smoothie Caribbean',  categoria: 'bebidas',  precio: 6.00, emoji: '🥤', orden: 2 },
  { nombre: 'Smoothie Happy Fruit',categoria: 'bebidas',  precio: 6.00, emoji: '🥤', orden: 3 },
  { nombre: 'Smoothie Passion Fruit', categoria: 'bebidas', precio: 6.00, emoji: '🥤', orden: 4 },
  { nombre: 'Smoothie Power',      categoria: 'bebidas',  precio: 6.00, emoji: '🥤', orden: 5 },
  { nombre: 'Smoothie Sunrise',    categoria: 'bebidas',  precio: 6.00, emoji: '🥤', orden: 6 },
  { nombre: 'Smoothie Tropical',   categoria: 'bebidas',  precio: 6.00, emoji: '🥤', orden: 7 },
  { nombre: 'Smoothie Vitality',   categoria: 'bebidas',  precio: 6.00, emoji: '🥤', orden: 8 },
  { nombre: 'Milkshake Oreo',      categoria: 'bebidas',  precio: 6.00, emoji: '🥛', orden: 9 },
  { nombre: 'Milkshake Caribbean', categoria: 'bebidas',  precio: 6.00, emoji: '🥛', orden: 10 },
  { nombre: 'Milkshake Açai Boost',categoria: 'bebidas',  precio: 6.00, emoji: '🥛', orden: 11 },
  { nombre: 'Milkshake Passion Fruit', categoria: 'bebidas', precio: 6.00, emoji: '🥛', orden: 12 },
  { nombre: 'Milkshake Power',     categoria: 'bebidas',  precio: 6.00, emoji: '🥛', orden: 13 },
  { nombre: 'Milkshake Sunrise',   categoria: 'bebidas',  precio: 6.00, emoji: '🥛', orden: 14 },
  { nombre: 'Milkshake Tropical',  categoria: 'bebidas',  precio: 6.00, emoji: '🥛', orden: 15 },
  { nombre: 'Milkshake Vitality',  categoria: 'bebidas',  precio: 6.00, emoji: '🥛', orden: 16 },
  { nombre: 'Milkshake Happy Fruit','categoria': 'bebidas', precio: 6.00, emoji: '🥛', orden: 17 },
  { nombre: 'Milkshake Especial',  categoria: 'bebidas',  precio: 7.50, emoji: '🥛', orden: 18 },

  // ─── BEBIDAS FRÍAS ───────────────────────────────────────────────────────────
  { nombre: 'Granizado S',         categoria: 'bebidas',  precio: 2.50, emoji: '🧊', orden: 19 },
  { nombre: 'Granizado L',         categoria: 'bebidas',  precio: 3.50, emoji: '🧊', orden: 20 },
  { nombre: 'Polo Fruta',          categoria: 'bebidas',  precio: 3.50, emoji: '🍡', orden: 21 },
  { nombre: 'Polo Choco Stick',    categoria: 'bebidas',  precio: 4.50, emoji: '🍡', orden: 22 },
  { nombre: 'Iced Latte',          categoria: 'bebidas',  precio: 5.50, emoji: '☕', orden: 23 },
  { nombre: 'Agua',                categoria: 'bebidas',  precio: 1.80, emoji: '💧', orden: 24 },
  { nombre: 'Agua 1 Litro',        categoria: 'bebidas',  precio: 2.80, emoji: '💧', orden: 25 },
  { nombre: 'Agua con Gas',        categoria: 'bebidas',  precio: 1.80, emoji: '💧', orden: 26 },
  { nombre: 'Coca Cola',           categoria: 'bebidas',  precio: 2.00, emoji: '🥤', orden: 27 },
  { nombre: 'Refresco en Lata',    categoria: 'bebidas',  precio: 2.00, emoji: '🥤', orden: 28 },
  { nombre: 'Zumo',                categoria: 'bebidas',  precio: 3.00, emoji: '🍊', orden: 29 },
  { nombre: 'Fuze Tea',            categoria: 'bebidas',  precio: 2.00, emoji: '🍵', orden: 30 },

  // ─── CAFETERÍA ───────────────────────────────────────────────────────────────
  { nombre: 'Café Solo',           categoria: 'otros',    precio: 1.70, emoji: '☕', orden: 1 },
  { nombre: 'Café amb Llet',       categoria: 'otros',    precio: 2.00, emoji: '☕', orden: 2 },
  { nombre: 'Cortado',             categoria: 'otros',    precio: 1.70, emoji: '☕', orden: 3 },
  { nombre: 'Capuchino',           categoria: 'otros',    precio: 2.00, emoji: '☕', orden: 4 },
  { nombre: 'Americano',           categoria: 'otros',    precio: 2.00, emoji: '☕', orden: 5 },
  { nombre: 'Té Chai',             categoria: 'otros',    precio: 3.00, emoji: '🍵', orden: 6 },
  { nombre: 'Chocolate a la Taza', categoria: 'otros',    precio: 3.50, emoji: '🍫', orden: 7 },

  // ─── TOPPINGS & EXTRAS ──────────────────────────────────────────────────────
  { nombre: 'Topping Helado',      categoria: 'otros',    precio: 1.00, emoji: '➕', orden: 8 },
  { nombre: 'Fresa Topping',       categoria: 'otros',    precio: 2.00, emoji: '🍓', orden: 9 },
  { nombre: 'Cookie Topping',      categoria: 'otros',    precio: 2.00, emoji: '🍪', orden: 10 },
  { nombre: 'Nata Topping',        categoria: 'otros',    precio: 1.00, emoji: '🥛', orden: 11 },
  { nombre: 'Plátano Topping',     categoria: 'otros',    precio: 1.60, emoji: '🍌', orden: 12 },
  { nombre: 'Salsa Extra',         categoria: 'otros',    precio: 1.50, emoji: '🫙', orden: 13 },
  { nombre: 'Gummy',               categoria: 'otros',    precio: 2.00, emoji: '🐻', orden: 14 },
  { nombre: 'Algodón de Azúcar',   categoria: 'otros',    precio: 1.90, emoji: '☁️',  orden: 15 },
  { nombre: 'Topping Galletas/Oreo',categoria:'otros',    precio: 2.00, emoji: '🍪', orden: 16 },
]

async function main() {
  console.log(`📋 Seeding ${carta.length} productos en ProductoTPV...`)

  // Borrar existentes primero para empezar limpio
  const deleted = await p.productoTPV.deleteMany({})
  console.log(`🗑️  Eliminados ${deleted.count} productos existentes`)

  let created = 0
  for (const item of carta) {
    await p.productoTPV.create({ data: item })
    created++
  }

  console.log(`✅ Creados ${created} productos correctamente.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => p.$disconnect())
