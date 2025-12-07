
import { useFormContext } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings } from "lucide-react"

export function GeneralSettings() {
    const { register, control, formState: { errors }, setValue, watch } = useFormContext()
    const timezone = watch("general.timezone")

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <CardTitle>Configuración General</CardTitle>
                </div>
                <CardDescription>
                    Información básica de la tienda y configuración general
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="general.nombreTienda">Nombre de la Tienda</Label>
                        <Input
                            id="general.nombreTienda"
                            {...register("general.nombreTienda")}
                        />
                        {errors.general?.nombreTienda && (
                            <p className="text-sm text-red-500">{errors.general.nombreTienda.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="general.telefono">Teléfono</Label>
                        <Input
                            id="general.telefono"
                            {...register("general.telefono")}
                        />
                        {errors.general?.telefono && (
                            <p className="text-sm text-red-500">{errors.general.telefono.message}</p>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="general.direccion">Dirección</Label>
                    <Input
                        id="general.direccion"
                        {...register("general.direccion")}
                    />
                    {errors.general?.direccion && (
                        <p className="text-sm text-red-500">{errors.general.direccion.message}</p>
                    )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="general.email">Email de Contacto</Label>
                        <Input
                            id="general.email"
                            type="email"
                            {...register("general.email")}
                        />
                        {errors.general?.email && (
                            <p className="text-sm text-red-500">{errors.general.email.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="general.timezone">Zona Horaria</Label>
                        <Select
                            value={timezone}
                            onValueChange={(value) => setValue('general.timezone', value, { shouldValidate: true })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione zona horaria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Europe/Madrid">Europa/Madrid</SelectItem>
                                <SelectItem value="Europe/London">Europa/Londres</SelectItem>
                                <SelectItem value="America/New_York">América/Nueva York</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
