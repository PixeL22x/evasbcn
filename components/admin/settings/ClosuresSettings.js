
import { useFormContext, Controller } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Clock } from "lucide-react"

export function ClosuresSettings() {
    const { register, control, formState: { errors } } = useFormContext()

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <CardTitle>Configuración de Cierres</CardTitle>
                </div>
                <CardDescription>
                    Parámetros del proceso de cierre de tienda
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="cierres.tiempoLimite">Tiempo Límite por Tarea (minutos)</Label>
                    <Input
                        id="cierres.tiempoLimite"
                        type="number"
                        {...register("cierres.tiempoLimite")}
                    />
                    {errors.cierres?.tiempoLimite && (
                        <p className="text-sm text-red-500">{errors.cierres.tiempoLimite.message}</p>
                    )}
                </div>
                <Separator />
                <div className="space-y-4">
                    <Controller
                        control={control}
                        name="cierres.requiereFotos"
                        render={({ field }) => (
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Requerir Fotos en Tareas</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Obligar a los trabajadores a subir fotos en ciertas tareas
                                    </p>
                                </div>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </div>
                        )}
                    />

                    <Controller
                        control={control}
                        name="cierres.validacionAutomatica"
                        render={({ field }) => (
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Validación Automática</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Validar automáticamente las tareas completadas
                                    </p>
                                </div>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </div>
                        )}
                    />

                    <Controller
                        control={control}
                        name="cierres.notificacionesEmail"
                        render={({ field }) => (
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Notificaciones por Email</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enviar notificaciones cuando se complete un cierre
                                    </p>
                                </div>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </div>
                        )}
                    />

                    <Controller
                        control={control}
                        name="cierres.backupAutomatico"
                        render={({ field }) => (
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Backup Automático</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Crear respaldos automáticos de los datos
                                    </p>
                                </div>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </div>
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
