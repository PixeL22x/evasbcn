import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Clock, Camera, Calculator, ChevronDown } from 'lucide-react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function TaskToggleEditor({ tasks, onTasksChange }) {
    const [expandedPhotos, setExpandedPhotos] = useState({})

    const handleToggle = (index, newValue) => {
        const updated = [...tasks]
        updated[index] = { ...updated[index], activa: newValue }
        onTasksChange(updated)
    }

    const handlePhotoToggle = (taskIndex, photoIndex, newValue) => {
        const updated = [...tasks]
        const task = updated[taskIndex]

        if (task.fotosRequeridas) {
            try {
                const fotos = JSON.parse(task.fotosRequeridas)
                fotos[photoIndex] = { ...fotos[photoIndex], activa: newValue }
                updated[taskIndex] = {
                    ...task,
                    fotosRequeridas: JSON.stringify(fotos)
                }
                onTasksChange(updated)
            } catch (e) {
                console.error('Error parsing fotosRequeridas:', e)
            }
        }
    }

    const togglePhotoExpand = (taskIndex) => {
        setExpandedPhotos(prev => ({
            ...prev,
            [taskIndex]: !prev[taskIndex]
        }))
    }

    const getFotosActivas = (fotosString) => {
        if (!fotosString) return { total: 0, activas: 0 }
        try {
            const fotos = JSON.parse(fotosString)
            const activas = fotos.filter(f => f.activa !== false).length
            return { total: fotos.length, activas }
        } catch (e) {
            return { total: 0, activas: 0 }
        }
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No hay tareas configuradas
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {tasks.map((task, idx) => {
                const fotos = task.requiereFotos && task.fotosRequeridas
                    ? (() => {
                        try {
                            return JSON.parse(task.fotosRequeridas)
                        } catch (e) {
                            return []
                        }
                    })()
                    : []
                const { total, activas } = getFotosActivas(task.fotosRequeridas)

                return (
                    <div
                        key={idx}
                        className={`
                            rounded-lg border transition-all
                            ${task.activa !== false
                                ? 'bg-card border-border'
                                : 'bg-muted/50 border-muted opacity-60'
                            }
                        `}
                    >
                        {/* Task Header */}
                        <div className="flex items-center justify-between p-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-medium ${task.activa === false && 'line-through text-muted-foreground'}`}>
                                        {task.nombre}
                                    </span>
                                    {task.activa === false && (
                                        <Badge variant="secondary" className="text-xs">
                                            Desactivada
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {task.duracion} min
                                    </span>
                                    {task.requiereFotos && (
                                        <span className="flex items-center gap-1">
                                            <Camera className="w-3 h-3" />
                                            Fotos ({activas}/{total})
                                        </span>
                                    )}
                                    {task.requiereInput && (
                                        <span className="flex items-center gap-1">
                                            <Calculator className="w-3 h-3" />
                                            Input
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Switch
                                checked={task.activa !== false}
                                onCheckedChange={(checked) => handleToggle(idx, checked)}
                            />
                        </div>

                        {/* Photos Collapsible */}
                        {task.requiereFotos && fotos.length > 0 && task.activa !== false && (
                            <Collapsible
                                open={expandedPhotos[idx]}
                                onOpenChange={() => togglePhotoExpand(idx)}
                            >
                                <div className="px-4 pb-2">
                                    <CollapsibleTrigger asChild>
                                        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedPhotos[idx] ? 'rotate-180' : ''}`} />
                                            <span>Fotos requeridas ({activas} de {total} activas)</span>
                                        </button>
                                    </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent>
                                    <div className="px-4 pb-4 space-y-1">
                                        {fotos.map((foto, photoIdx) => (
                                            <div
                                                key={photoIdx}
                                                className={`
                                                    flex items-center justify-between p-2 rounded border
                                                    ${foto.activa !== false
                                                        ? 'bg-background border-border'
                                                        : 'bg-muted/50 border-muted opacity-60'
                                                    }
                                                `}
                                            >
                                                <span className={`text-sm ${foto.activa === false && 'line-through text-muted-foreground'}`}>
                                                    {foto.descripcion}
                                                </span>
                                                <Switch
                                                    checked={foto.activa !== false}
                                                    onCheckedChange={(checked) => handlePhotoToggle(idx, photoIdx, checked)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
