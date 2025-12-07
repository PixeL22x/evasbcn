
import { useFormContext, Controller } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

export function SystemSettings() {
    const { control, setValue, watch } = useFormContext()
    const logLevel = watch("sistema.logLevel")

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <CardTitle>Configuración del Sistema</CardTitle>
                    <Badge variant="secondary">Avanzado</Badge>
                </div>
                <CardDescription>
                    Configuraciones técnicas del sistema (solo para administradores)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="sistema.logLevel">Nivel de Log</Label>
                    <Select
                        value={logLevel}
                        onValueChange={(value) => setValue('sistema.logLevel', value, { shouldValidate: true })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione nivel de log" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="error">Error</SelectItem>
                            <SelectItem value="warn">Warning</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="debug">Debug</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Separator />
                <div className="space-y-4">
                    <Controller
                        control={control}
                        name="sistema.modoDebug"
                        render={({ field }) => (
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Modo Debug</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Activar información de depuración detallada
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
                        name="sistema.cacheEnabled"
                        render={({ field }) => (
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Cache Habilitado</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Usar caché para mejorar el rendimiento
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
                        name="sistema.compressionEnabled"
                        render={({ field }) => (
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Compresión Habilitada</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Comprimir respuestas para reducir el ancho de banda
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
