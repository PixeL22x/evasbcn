
import { z } from "zod"

export const generalSchema = z.object({
    nombreTienda: z.string().min(1, "El nombre es obligatorio"),
    direccion: z.string().min(1, "La dirección es obligatoria"),
    telefono: z.string().min(1, "El teléfono es obligatorio"),
    email: z.string().email("Email inválido"),
    timezone: z.string()
})

export const cierresSchema = z.object({
    tiempoLimite: z.coerce.number().min(1, "Debe ser al menos 1 minuto"),
    requiereFotos: z.boolean(),
    validacionAutomatica: z.boolean(),
    notificacionesEmail: z.boolean(),
    backupAutomatico: z.boolean()
})

export const trabajadoresSchema = z.object({
    maxTrabajadores: z.coerce.number().min(1, "Mínimo 1 trabajador"),
    requiereValidacion: z.boolean(),
    permisosFotos: z.boolean(),
    sessionTimeout: z.coerce.number().min(1, "Mínimo 1 minuto")
})

export const sistemaSchema = z.object({
    modoDebug: z.boolean(),
    logLevel: z.enum(["error", "warn", "info", "debug"]),
    cacheEnabled: z.boolean(),
    compressionEnabled: z.boolean()
})

export const settingsSchema = z.object({
    general: generalSchema,
    cierres: cierresSchema,
    trabajadores: trabajadoresSchema,
    sistema: sistemaSchema
})
