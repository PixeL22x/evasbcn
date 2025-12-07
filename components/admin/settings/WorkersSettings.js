
import { useFormContext, Controller } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Users } from "lucide-react"

export function WorkersSettings() {
    const { register, control, formState: { errors } } = useFormContext()

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle>Gestión de Trabajadores</CardTitle>
                </div>
                <CardDescription>
                    Configuración relacionada con el equipo de trabajo
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="trabajadores.maxTrabajadores">Máximo de Trabajadores</Label>
                        <Input
                            id="trabajadores.maxTrabajadores"
                            type="number"
                            {...register("trabajadores.maxTrabajadores")}
                        />
                        {errors.trabajadores?.maxTrabajadores && (
                            <p className="text-sm text-red-500">{errors.trabajadores.maxTrabajadores.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="trabajadores.sessionTimeout">Timeout de Sesión (minutos)</Label>
                        <Input
                            id="trabajadores.sessionTimeout"
                            type="number"
                            {...register("trabajadores.sessionTimeout")}
                        />
                        {errors.trabajadores?.sessionTimeout && (
                            <p className="text-sm text-red-500">{errors.trabajadores.sessionTimeout.message}</p>
                        )}
                    </div>
                </div>
                <Separator />
                <div className="space-y-4">
                    <Controller
                        control={control}
                        name="trabajadores.requiereValidacion"
                        render={({ field }) => (
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Requerir Validación de Nuevos Trabajadores</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Los nuevos trabajadores deben ser aprobados por un administrador
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
                        name="trabajadores.permisosFotos"
                        render={({ field }) => (
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Permisos de Cámara</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Permitir a los trabajadores acceder a la cámara para fotos
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
