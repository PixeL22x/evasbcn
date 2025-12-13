import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function LoadingState({
    message = "Cargando...",
    icon: Icon,
    variant = "card" // "card" | "inline" | "fullscreen"
}) {
    const spinner = (
        <div className="flex flex-col items-center justify-center gap-4">
            {Icon && <Icon className="h-10 w-10 text-muted-foreground/40" />}
            <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>
    )

    if (variant === "card") {
        return (
            <Card>
                <CardContent className="py-12">
                    {spinner}
                </CardContent>
            </Card>
        )
    }

    if (variant === "fullscreen") {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                {spinner}
            </div>
        )
    }

    return <div className="py-8">{spinner}</div>
}
