import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Clock, Save, ChevronDown, CheckCircle2, XCircle } from "lucide-react"
import { TaskToggleEditor } from "./TaskToggleEditor"

export const ClosuresSettings = forwardRef(function ClosuresSettings(props, ref) {
    const { register, control, formState: { errors } } = useFormContext()

    // Estados locales para los editores JSON
    const [tasksManana, setTasksManana] = useState('')
    const [tasksTarde, setTasksTarde] = useState('')
    const [parsedTasksManana, setParsedTasksManana] = useState([])
    const [parsedTasksTarde, setParsedTasksTarde] = useState([])
    const [loadingTasks, setLoadingTasks] = useState(false)
    const [savingTasks, setSavingTasks] = useState(false)
    const [showJsonEditor, setShowJsonEditor] = useState(false)
    const [saveStatus, setSaveStatus] = useState(null) // { ok: bool, msg: string } | null

    useEffect(() => {
        loadTasksConfig()
    }, [])

    const loadTasksConfig = async () => {
        try {
            setLoadingTasks(true)
            const res = await fetch('/api/admin/settings/tasks')
            if (res.ok) {
                const data = await res.json()

                // Guardar tanto JSON string como parsed
                setParsedTasksManana(data.mañana || [])
                setParsedTasksTarde(data.tarde || [])
                setTasksManana(JSON.stringify(data.mañana || [], null, 2))
                setTasksTarde(JSON.stringify(data.tarde || [], null, 2))
            }
        } catch (error) {
            console.error("Error loading tasks:", error)
        } finally {
            setLoadingTasks(false)
        }
    }

    const showFeedback = (ok, msg) => {
        setSaveStatus({ ok, msg })
        setTimeout(() => setSaveStatus(null), 4000)
    }

    const saveTasksConfig = async (turno, jsonString) => {
        try {
            const parsed = JSON.parse(jsonString)
            setSavingTasks(true)
            const res = await fetch('/api/admin/settings/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ turno, tasks: parsed })
            })
            if (res.ok) {
                showFeedback(true, `Tareas de ${turno} guardadas ✅`)
                loadTasksConfig()
            } else {
                showFeedback(false, 'Error al guardar en el servidor')
            }
        } catch (e) {
            showFeedback(false, 'JSON inválido: ' + e.message)
        } finally {
            setSavingTasks(false)
        }
    }

    const saveTasksFromToggles = async (e, turno, tasks) => {
        e.preventDefault()
        console.log('[ClosuresSettings] Guardando tareas de', turno, tasks)
        try {
            setSavingTasks(true)
            const res = await fetch('/api/admin/settings/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ turno, tasks })
            })
            if (res.ok) {
                showFeedback(true, `Tareas de ${turno} guardadas correctamente ✅`)
                loadTasksConfig()
            } else {
                const err = await res.json().catch(() => ({}))
                showFeedback(false, `Error al guardar: ${err.error || res.status}`)
            }
        } catch (e) {
            showFeedback(false, 'Error de red: ' + e.message)
        } finally {
            setSavingTasks(false)
        }
    }

    // Exponer al padre la función para guardar ambos turnos desde el botón principal
    useImperativeHandle(ref, () => ({
        saveBothTurnos: async () => {
            try {
                setSavingTasks(true)
                const [resManana, resTarde] = await Promise.all([
                    fetch('/api/admin/settings/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ turno: 'mañana', tasks: parsedTasksManana })
                    }),
                    fetch('/api/admin/settings/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ turno: 'tarde', tasks: parsedTasksTarde })
                    })
                ])
                if (!resManana.ok || !resTarde.ok) {
                    throw new Error('Error al guardar tareas')
                }
                loadTasksConfig()
            } finally {
                setSavingTasks(false)
            }
        }
    }), [parsedTasksManana, parsedTasksTarde])

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
                    <div>
                        <h3 className="text-lg font-medium">Gestión de Tareas</h3>
                        <p className="text-sm text-muted-foreground">
                            Activa o desactiva tareas individuales para cada turno
                        </p>
                    </div>

                    <Tabs defaultValue="manana" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manana">Mañana</TabsTrigger>
                            <TabsTrigger value="tarde">Tarde</TabsTrigger>
                        </TabsList>

                        {/* Feedback visual de guardado */}
                        {saveStatus && (
                            <div className={`flex items-center gap-2 mt-3 p-3 rounded-lg text-sm font-medium ${
                                saveStatus.ok
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                            }`}>
                                {saveStatus.ok
                                    ? <span>✅ {saveStatus.msg}</span>
                                    : <span>❌ {saveStatus.msg}</span>
                                }
                            </div>
                        )}

                        <TabsContent value="manana">
                            <div className="space-y-4 mt-4">
                                {loadingTasks ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Cargando tareas...
                                    </div>
                                ) : (
                                    <>
                                        <TaskToggleEditor
                                            tasks={parsedTasksManana}
                                            onTasksChange={setParsedTasksManana}
                                        />
                                        <Button
                                            type="button"
                                            onClick={(e) => saveTasksFromToggles(e, 'mañana', parsedTasksManana)}
                                            disabled={savingTasks || loadingTasks}
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {savingTasks ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="tarde">
                            <div className="space-y-4 mt-4">
                                {loadingTasks ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Cargando tareas...
                                    </div>
                                ) : (
                                    <>
                                        <TaskToggleEditor
                                            tasks={parsedTasksTarde}
                                            onTasksChange={setParsedTasksTarde}
                                        />
                                        <Button
                                            type="button"
                                            onClick={(e) => saveTasksFromToggles(e, 'tarde', parsedTasksTarde)}
                                            disabled={savingTasks || loadingTasks}
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {savingTasks ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Editor JSON Avanzado (Colapsable) */}
                    <Collapsible open={showJsonEditor} onOpenChange={setShowJsonEditor}>
                        <CollapsibleTrigger asChild>
                            <Button type="button" variant="ghost" className="w-full justify-between">
                                <span className="text-sm font-medium">⚙️ Modo Avanzado (Editor JSON)</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showJsonEditor ? 'rotate-180' : ''}`} />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground mb-4">
                                    ⚠️ Editor avanzado: Edita la estructura JSON directamente. Ten cuidado con la sintaxis.
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
                                                type="button"
                                                size="sm"
                                                onClick={() => saveTasksConfig('mañana', tasksManana)}
                                                disabled={savingTasks || loadingTasks}
                                            >
                                                <Save className="w-4 h-4 mr-2" /> Guardar JSON Mañana
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
                                                type="button"
                                                size="sm"
                                                onClick={() => saveTasksConfig('tarde', tasksTarde)}
                                                disabled={savingTasks || loadingTasks}
                                            >
                                                <Save className="w-4 h-4 mr-2" /> Guardar JSON Tarde
                                            </Button>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </CardContent>
        </Card>
    )
})
