
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Clock, Save, Loader2, Sun, Moon, Copy } from "lucide-react"

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const DEFAULT_SHIFTS = {
    M: {
        0: { hours: 5.5, start: '11:30', end: '17:00' }, // Domingo
        1: { hours: 4.5, start: '12:30', end: '17:00' }, // Lunes
        2: { hours: 4.5, start: '12:30', end: '17:00' }, // Martes
        3: { hours: 4.5, start: '12:30', end: '17:00' }, // Miércoles
        4: { hours: 4.5, start: '12:30', end: '17:00' }, // Jueves
        5: { hours: 4.5, start: '12:30', end: '17:00' }, // Viernes
        6: { hours: 5.5, start: '11:30', end: '17:00' }, // Sábado
    },
    T: {
        0: { hours: 6, start: '17:00', end: '23:00' }, // Domingo
        1: { hours: 6, start: '17:00', end: '23:00' }, // Lunes
        2: { hours: 6, start: '17:00', end: '23:00' }, // Martes
        3: { hours: 6, start: '17:00', end: '23:00' }, // Miércoles
        4: { hours: 6, start: '17:00', end: '23:00' }, // Jueves
        5: { hours: 6, start: '17:00', end: '23:00' }, // Viernes
        6: { hours: 6, start: '17:00', end: '23:00' }, // Sábado
    }
}

// Migration function to convert old format to new format
function migrateOldFormat(oldShifts) {
    if (!oldShifts) return DEFAULT_SHIFTS

    // Check if it's already in new format (has numeric keys)
    if (oldShifts.M && typeof oldShifts.M[0] === 'object') {
        return oldShifts
    }

    // Convert old format to new format
    const newShifts = { M: {}, T: {} }

    for (const shiftKey of ['M', 'T']) {
        const old = oldShifts[shiftKey] || DEFAULT_SHIFTS[shiftKey]

        // If old format exists
        if (old.hours !== undefined) {
            // Weekdays (1-5) use regular hours
            for (let day = 1; day <= 5; day++) {
                newShifts[shiftKey][day] = {
                    hours: old.hours || 0,
                    start: old.start || '00:00',
                    end: old.end || '00:00'
                }
            }
            // Weekend (0, 6) use weekend hours
            newShifts[shiftKey][0] = {
                hours: old.hoursWeekend || old.hours || 0,
                start: old.startWeekend || old.start || '00:00',
                end: old.endWeekend || old.end || '00:00'
            }
            newShifts[shiftKey][6] = {
                hours: old.hoursWeekend || old.hours || 0,
                start: old.startWeekend || old.start || '00:00',
                end: old.endWeekend || old.end || '00:00'
            }
        } else {
            // Use default if no old data
            newShifts[shiftKey] = DEFAULT_SHIFTS[shiftKey]
        }
    }

    return newShifts
}

export function ScheduleSettings({ onSave }) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [configName, setConfigName] = useState("Estándar")
    const [shifts, setShifts] = useState(DEFAULT_SHIFTS)

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/configuracion?clave=horarios_active_profile')
            const data = await res.json()
            if (data && data.shifts) {
                // Migrate old format to new format
                const migratedShifts = migrateOldFormat(data.shifts)
                setShifts(migratedShifts)
                if (data.profileName) setConfigName(data.profileName)
            }
        } catch (error) {
            console.error("Error loading schedule config:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleShiftChange = (shiftKey, dayIndex, field, value) => {
        setShifts(prev => ({
            ...prev,
            [shiftKey]: {
                ...prev[shiftKey],
                [dayIndex]: {
                    ...prev[shiftKey][dayIndex],
                    [field]: field === 'hours' ? parseFloat(value) : value
                }
            }
        }))
    }

    const copyToWeekdays = (shiftKey) => {
        const mondayConfig = shifts[shiftKey][1]
        setShifts(prev => {
            const newShift = { ...prev[shiftKey] }
            for (let day = 1; day <= 5; day++) {
                newShift[day] = { ...mondayConfig }
            }
            return { ...prev, [shiftKey]: newShift }
        })
    }

    const copyToWeekend = (shiftKey) => {
        const saturdayConfig = shifts[shiftKey][6]
        setShifts(prev => ({
            ...prev,
            [shiftKey]: {
                ...prev[shiftKey],
                0: { ...saturdayConfig },
                6: { ...saturdayConfig }
            }
        }))
    }

    const saveConfig = async () => {
        try {
            setSaving(true)
            const configToSave = {
                profileName: configName,
                shifts: shifts
            }

            const res = await fetch('/api/configuracion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clave: 'horarios_active_profile',
                    valor: configToSave
                })
            })

            if (res.ok) {
                alert('Configuración de horarios guardada')
                if (onSave) onSave()
            } else {
                alert('Error al guardar')
            }
        } catch (error) {
            console.error(error)
            alert('Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-4"><Loader2 className="animate-spin" /> Cargando configuración...</div>

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horarios por Día de la Semana
                </CardTitle>
                <CardDescription>
                    Configura las horas de inicio, fin y duración para cada día de la semana. Cada día puede tener horarios diferentes.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="grid gap-4 max-w-sm">
                    <Label>Nombre del Perfil (ej: Verano 2024)</Label>
                    <Input
                        value={configName}
                        onChange={(e) => setConfigName(e.target.value)}
                        placeholder="Ej: Horario Invierno"
                    />
                </div>

                {/* TURNO MAÑANA */}
                <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50 dark:bg-amber-900/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-500">
                            <Sun className="h-4 w-4" />
                            Turno Mañana (M)
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToWeekdays('M')}
                                className="text-xs flex-1 sm:flex-none"
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                <span className="sm:hidden">Lun-Vie</span>
                                <span className="hidden sm:inline">Copiar Lun a L-V</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToWeekend('M')}
                                className="text-xs flex-1 sm:flex-none"
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                <span className="sm:hidden">Sáb-Dom</span>
                                <span className="hidden sm:inline">Copiar Sáb a S-D</span>
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-amber-200">
                                    <th className="text-left p-2 font-medium">Día</th>
                                    {DAYS.map((day, idx) => (
                                        <th key={idx} className="text-center p-2 font-medium min-w-[100px]">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-amber-100">
                                    <td className="p-2 text-xs text-muted-foreground">Inicio</td>
                                    {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                                        <td key={dayIdx} className="p-1">
                                            <Input
                                                type="time"
                                                value={shifts.M[dayIdx]?.start || '00:00'}
                                                onChange={(e) => handleShiftChange('M', dayIdx, 'start', e.target.value)}
                                                className="text-xs h-8"
                                            />
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-b border-amber-100">
                                    <td className="p-2 text-xs text-muted-foreground">Fin</td>
                                    {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                                        <td key={dayIdx} className="p-1">
                                            <Input
                                                type="time"
                                                value={shifts.M[dayIdx]?.end || '00:00'}
                                                onChange={(e) => handleShiftChange('M', dayIdx, 'end', e.target.value)}
                                                className="text-xs h-8"
                                            />
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-2 text-xs text-muted-foreground">Horas</td>
                                    {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                                        <td key={dayIdx} className="p-1">
                                            <Input
                                                type="number"
                                                step="0.5"
                                                value={shifts.M[dayIdx]?.hours || 0}
                                                onChange={(e) => handleShiftChange('M', dayIdx, 'hours', e.target.value)}
                                                className="text-xs h-8"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* TURNO TARDE */}
                <div className="border rounded-lg p-4 space-y-4 bg-blue-50/50 dark:bg-blue-900/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-500">
                            <Moon className="h-4 w-4" />
                            Turno Tarde (T)
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToWeekdays('T')}
                                className="text-xs flex-1 sm:flex-none"
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                <span className="sm:hidden">Lun-Vie</span>
                                <span className="hidden sm:inline">Copiar Lun a L-V</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToWeekend('T')}
                                className="text-xs flex-1 sm:flex-none"
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                <span className="sm:hidden">Sáb-Dom</span>
                                <span className="hidden sm:inline">Copiar Sáb a S-D</span>
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-blue-200">
                                    <th className="text-left p-2 font-medium">Día</th>
                                    {DAYS.map((day, idx) => (
                                        <th key={idx} className="text-center p-2 font-medium min-w-[100px]">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-blue-100">
                                    <td className="p-2 text-xs text-muted-foreground">Inicio</td>
                                    {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                                        <td key={dayIdx} className="p-1">
                                            <Input
                                                type="time"
                                                value={shifts.T[dayIdx]?.start || '00:00'}
                                                onChange={(e) => handleShiftChange('T', dayIdx, 'start', e.target.value)}
                                                className="text-xs h-8"
                                            />
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-b border-blue-100">
                                    <td className="p-2 text-xs text-muted-foreground">Fin</td>
                                    {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                                        <td key={dayIdx} className="p-1">
                                            <Input
                                                type="time"
                                                value={shifts.T[dayIdx]?.end || '00:00'}
                                                onChange={(e) => handleShiftChange('T', dayIdx, 'end', e.target.value)}
                                                className="text-xs h-8"
                                            />
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-2 text-xs text-muted-foreground">Horas</td>
                                    {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                                        <td key={dayIdx} className="p-1">
                                            <Input
                                                type="number"
                                                step="0.5"
                                                value={shifts.T[dayIdx]?.hours || 0}
                                                onChange={(e) => handleShiftChange('T', dayIdx, 'hours', e.target.value)}
                                                className="text-xs h-8"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end pt-4 sticky bottom-0 bg-background/95 backdrop-blur py-4 -mx-4 px-4 sm:static sm:bg-transparent sm:py-0 sm:px-0 border-t sm:border-t-0">
                    <Button onClick={saveConfig} disabled={saving} className="w-full sm:w-auto shadow-lg sm:shadow-none">
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar Cambios
                    </Button>
                </div>

            </CardContent>
        </Card>
    )
}
