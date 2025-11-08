# Análisis de Almacenamiento de Reseñas en Base de Datos

## Campos que se guardan por cada reseña

Cuando un trabajador registra una reseña, se guarda el siguiente registro en MongoDB:

### Modelo Resena (Prisma Schema)

```prisma
model Resena {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  trabajadorId String  @db.ObjectId
  trabajador   Trabajador @relation(fields: [trabajadorId], references: [id], onDelete: Cascade)
  calificacion Int     // 1-5 estrellas
  fechaResena DateTime // Fecha en que se recibió la reseña
  fechaRegistro DateTime @default(now()) // Fecha en que el trabajador la registró
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Desglose de campos guardados

| Campo | Tipo | Tamaño (bytes) | Descripción |
|-------|------|----------------|-------------|
| `_id` | ObjectId | 12 | ID único del documento (generado automáticamente) |
| `trabajadorId` | ObjectId | 12 | Referencia al trabajador que registró la reseña |
| `calificacion` | Int32 | 4 | Número entero (1-5) |
| `fechaResena` | DateTime | 8 | Fecha de la reseña (solo fecha, hora = 00:00:00) |
| `fechaRegistro` | DateTime | 8 | Fecha de registro (solo fecha, hora = 00:00:00) |
| `createdAt` | DateTime | 8 | Timestamp de creación |
| `updatedAt` | DateTime | 8 | Timestamp de última actualización |

## Cálculo del tamaño total

### Tamaño de datos puros:
- ObjectId (`_id`): 12 bytes
- ObjectId (`trabajadorId`): 12 bytes
- Int (`calificacion`): 4 bytes
- DateTime (`fechaResena`): 8 bytes
- DateTime (`fechaRegistro`): 8 bytes
- DateTime (`createdAt`): 8 bytes
- DateTime (`updatedAt`): 8 bytes
- **Subtotal datos: 60 bytes**

### Overhead de MongoDB:
- Overhead del documento: ~16 bytes
- Nombres de campos (BSON): ~70 bytes
  - `_id`: 3 bytes
  - `trabajadorId`: 13 bytes
  - `calificacion`: 12 bytes
  - `fechaResena`: 12 bytes
  - `fechaRegistro`: 14 bytes
  - `createdAt`: 10 bytes
  - `updatedAt`: 10 bytes
- Padding y alineación: ~4 bytes

### **Tamaño total aproximado: ~150 bytes por registro**

## Ejemplo práctico

Si tienes:
- **100 reseñas**: ~15 KB
- **1,000 reseñas**: ~150 KB
- **10,000 reseñas**: ~1.5 MB
- **100,000 reseñas**: ~15 MB

## Optimizaciones implementadas

1. ✅ **Solo fecha, sin hora**: Las fechas se guardan con hora 00:00:00, ahorrando variabilidad
2. ✅ **Sin campos opcionales**: No hay campos null que ocupen espacio
3. ✅ **Paginación**: Solo se cargan 5 reseñas por vez en el admin
4. ✅ **Índices**: MongoDB crea índices automáticos en `_id` y relaciones

## Comparación con otros modelos

- **RegistroTemperatura**: ~200-250 bytes (incluye String para hora, Float, String opcional para observaciones)
- **MovimientoStock**: ~180-220 bytes (incluye varios Strings)
- **Resena**: ~150 bytes (más ligero, solo datos esenciales)

## Conclusión

Cada reseña ocupa aproximadamente **150 bytes** en MongoDB, lo que es muy eficiente. Con la paginación implementada, el sistema puede manejar miles de reseñas sin problemas de rendimiento.

