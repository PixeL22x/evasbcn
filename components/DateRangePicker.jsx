"use client"

import * as React from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { addDays, format } from "date-fns"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ModernCalendar } from "@/components/ModernCalendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { useIsMobile } from "@/hooks/use-mobile"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
    SheetClose,
    SheetFooter
} from "@/components/ui/sheet"

export function DateRangePicker({
    className,
    date,
    setDate,
}) {
    const isMobile = useIsMobile()
    const [isOpen, setIsOpen] = React.useState(false)

    const triggerButton = (
        <Button
            id="date"
            variant={"outline"}
            className={cn(
                "w-full justify-between text-left font-medium h-12 rounded-xl border-input/50 shadow-sm bg-card hover:bg-accent/50",
                !date && "text-muted-foreground",
                className
            )}
        >
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                    <CalendarIcon className="h-4 w-4" />
                </div>
                {date?.from ? (
                    date.to ? (
                        <span className="text-sm">
                            {format(date.from, "dd MMM", { locale: es })} -{" "}
                            {format(date.to, "dd MMM, yyyy", { locale: es })}
                        </span>
                    ) : (
                        <span className="text-sm">{format(date.from, "dd MMM, yyyy", { locale: es })}</span>
                    )
                ) : (
                    <span className="text-sm">Seleccionar fecha</span>
                )}
            </div>
            {/* Chevron indicator */}
            <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 opacity-50"
            >
                <path
                    d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                ></path>
            </svg>
        </Button>
    )

    if (isMobile) {
        return (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    {triggerButton}
                </SheetTrigger>
                <SheetContent side="bottom" className="p-0 rounded-t-[32px] h-[90dvh] flex flex-col bg-background">
                    {/* Header with Active Selection */}
                    <div className="p-6 pb-4 border-b bg-gradient-to-b from-background to-muted/20">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período Seleccionado</span>
                        </div>
                        <div className="flex flex-col gap-4">
                            <SheetTitle className="text-2xl font-bold tracking-tight">
                                {date?.from ? (
                                    date.to ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-primary">{format(date.from, "dd MMM", { locale: es })}</span>
                                            <span className="text-muted-foreground/40">→</span>
                                            <span className="text-primary">{format(date.to, "dd MMM", { locale: es })}</span>
                                        </div>
                                    ) : (
                                        <span className="text-primary">{format(date.from, "dd MMM yyyy", { locale: es })}</span>
                                    )
                                ) : (
                                    <span className="text-muted-foreground/50">Selecciona fechas...</span>
                                )}
                            </SheetTitle>



                            {date?.from && date?.to && (
                                <SheetDescription className="text-sm font-medium">
                                    {Math.ceil((date.to - date.from) / (1000 * 60 * 60 * 24)) + 1} días
                                </SheetDescription>
                            )}
                        </div>
                    </div>

                    {/* Standard Shadcn Calendar with Vertical Scroll */}
                    <div className="flex-1 overflow-y-auto bg-background">
                        <div className="flex justify-center p-4">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={6}
                                pagedNavigation={false} // Disable pagination for vertical scroll
                                showOutsideDays={false}
                                locale={es}
                                className="p-0"
                                classNames={{
                                    months: "flex flex-col space-y-8",
                                    month: "space-y-4",
                                    caption: "flex justify-center pt-1 relative items-center mb-2",
                                    caption_label: "text-lg font-bold capitalize",
                                    table: "w-full border-collapse space-y-1",
                                    head_row: "flex",
                                    head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem] capitalize",
                                    row: "flex w-full mt-2",
                                    cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-accent hover:text-accent-foreground",
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold",
                                    day_today: "bg-accent text-accent-foreground border-2 border-primary/20",
                                    day_outside: "text-muted-foreground opacity-50",
                                    day_disabled: "text-muted-foreground opacity-50",
                                    day_range_middle: "aria-selected:bg-accent/50 aria-selected:text-accent-foreground",
                                    day_hidden: "invisible",
                                }}
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    {/* Footer Actions */}
                    <div className="p-4 border-t bg-background/95 backdrop-blur-sm grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-12 text-base font-medium rounded-xl"
                            onClick={() => setDate(undefined)}
                            disabled={!date?.from}
                        >
                            Limpiar
                        </Button>
                        <SheetClose asChild>
                            <Button
                                className="h-12 text-base font-semibold rounded-xl shadow-lg"
                                disabled={!date?.from}
                            >
                                Confirmar
                            </Button>
                        </SheetClose>
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    {triggerButton}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        locale={es}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
