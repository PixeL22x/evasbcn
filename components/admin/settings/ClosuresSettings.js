
import { useState, useEffect } from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Save } from "lucide-react"

export function ClosuresSettings() {
    const { register, control, formState: { errors } } = useFormContext()

    // Estados locales para los editores JSON
    const [tasksManana, setTasksManana] = useState('')
    const [tasksTarde, setTasksTarde] = useState('')
    const [loadingTasks, setLoadingTasks] = useState(false)
    const [savingTasks, setSavingTasks] = useState(false)

    useEffect(() => {
        loadTasksConfig()
    }, [])

    const loadTasksConfig = async () => {
        try {
            setLoadingTasks(true)
            const res = await fetch('/api/admin/settings/tasks')
            if (res.ok) {
                const data = await res.json()
                setTasksManana(JSON.stringify(data.mañana || [], null, 2))
                setTasksTarde(JSON.stringify(data.tarde || [], null, 2))
            }
        } catch (error) {
            console.error("Error loading tasks:", error)
        } finally {
            setLoadingTasks(false)
        }
    }

    const saveTasksConfig = async (turno, jsonString) => {
        try {
            // Validate JSON
            const parsed = JSON.parse(jsonString)

            setSavingTasks(true)
            const res = await fetch('/api/admin/settings/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    turno,
                    tasks: parsed
                })
            })

            if (res.ok) {
                alert(`Tareas de ${turno} guardadas correctamente`)
            } else {
                alert('Error al guardar')
            }
        } catch (e) {
            alert('JSON Inválido: ' + e.message)
        } finally {
            setSavingTasks(false)
        }
    }

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

                <Separator />


                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Editor de Tareas (Avanzado)</h3>
                    <p className="text-sm text-muted-foreground">
                        Edita la estructura JSON de las tareas para cada turno. Ten cuidado con la sintaxis.
                    </p>

                    <Tabs defaultValue="manana" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manana">Mañana</TabsTrigger>
                            <TabsTrigger value="tarde">Tarde</TabsTrigger>
                        </TabsList>
                        <TabsContent value="manana">
                            <div className="space-y-2 mt-4">
                                <Textarea
                                    value={tasksManana}
                                    onChange={(e) => setTasksManana(e.target.value)}
                                    className="font-mono text-xs h-[300px]"
                                    placeholder="Cargando configuración..."
                                />
                                <Button
                                    size="sm"
                                    onClick={() => saveTasksConfig('mañana', tasksManana)}
                                    disabled={savingTasks || loadingTasks}
                                >
                                    <Save className="w-4 h-4 mr-2" /> Guardar Tareas Mañana
                                </Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="tarde">
                            <div className="space-y-2 mt-4">
                                <Textarea
                                    value={tasksTarde}
                                    onChange={(e) => setTasksTarde(e.target.value)}
                                    className="font-mono text-xs h-[400px]"
                                    placeholder="Cargando configuración..."
                                />
                                <Button
                                    size="sm"
                                    onClick={() => saveTasksConfig('tarde', tasksTarde)}
                                    disabled={savingTasks || loadingTasks}
                                >
                                    <Save className="w-4 h-4 mr-2" /> Guardar Tareas Tarde
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    )
}
