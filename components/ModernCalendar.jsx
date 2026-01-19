"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function ModernCalendar({
    className,
    selected,
    onSelect,
    numberOfMonths = 3,
    ...props
}) {
    const [currentMonth, setCurrentMonth] = React.useState(selected?.from || new Date())

    const handlePreviousMonth = () => {
        setCurrentMonth(prev => subMonths(prev, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(prev => addMonths(prev, 1))
    }

    return (
        <div className={cn("flex flex-col", className)}>
            {/* Navigation Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background z-10">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousMonth}
                    className="gap-2 h-10 px-4 font-medium"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextMonth}
                    className="gap-2 h-10 px-4 font-medium"
                >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-y-auto flex-1 flex items-start justify-center">
                <div className="w-full max-w-[360px]">
                    <DayPicker
                        mode="range"
                        selected={selected}
                        onSelect={onSelect}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        numberOfMonths={numberOfMonths}
                        locale={es}
                        showOutsideDays={false}
                        className="w-full py-4"
                        classNames={{
                            months: "flex flex-col space-y-8 w-full",
                            month: "space-y-4 w-full",
                            caption: "flex justify-center pt-1 relative items-center mb-4",
                            caption_label: "text-lg font-bold capitalize",
                            nav: "hidden",
                            table: "w-full border-collapse table-fixed m-0",
                            head_row: "w-full border-b border-border/10",
                            head_cell: "text-muted-foreground font-semibold text-xs uppercase text-center h-8 align-middle pb-2",
                            row: "w-full mt-2",
                            cell: cn(
                                "relative p-0 text-center h-12 align-middle",
                                "[&:has([aria-selected])]:bg-accent/50",
                                "[&:has([aria-selected].day-range-start)]:rounded-l-full",
                                "[&:has([aria-selected].day-range-end)]:rounded-r-full",
                                "[&:has([aria-selected].day-range-start)]:bg-transparent",
                                "[&:has([aria-selected].day-range-end)]:bg-transparent"
                            ),
                            day: cn(
                                "h-10 w-10 p-0 font-medium text-sm rounded-full mx-auto flex items-center justify-center",
                                "hover:bg-accent hover:text-accent-foreground",
                                "focus:bg-accent focus:text-accent-foreground",
                                "transition-all duration-200 hover:scale-105",
                                "aria-selected:opacity-100"
                            ),
                            day_selected: cn(
                                "bg-primary text-primary-foreground",
                                "hover:bg-primary hover:text-primary-foreground",
                                "focus:bg-primary focus:text-primary-foreground",
                                "font-bold shadow-md ring-2 ring-primary/30"
                            ),
                            day_today: "bg-accent/50 text-accent-foreground font-bold border-2 border-primary/30",
                            day_outside: "text-muted-foreground/30 opacity-30",
                            day_disabled: "text-muted-foreground/30 opacity-30 line-through",
                            day_range_middle: cn(
                                "aria-selected:bg-accent/30",
                                "aria-selected:text-foreground",
                                "rounded-none"
                            ),
                            day_range_start: "rounded-l-full rounded-r-none",
                            day_range_end: "rounded-r-full rounded-l-none",
                            day_hidden: "invisible",
                        }}
                        {...props}
                    />
                </div>
            </div>
        </div>
    )
}

ModernCalendar.displayName = "ModernCalendar"

export { ModernCalendar }
