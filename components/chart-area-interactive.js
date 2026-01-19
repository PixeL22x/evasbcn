"use client"

import { useState, useEffect } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const chartConfig = {
  ventas: {
    label: "Ventas",
    color: "hsl(var(--chart-1))",
  },
}

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = useState("7d")
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    fetchChartData(timeRange)
  }, [timeRange])

  const fetchChartData = async (range) => {
    try {
      const response = await fetch(`/api/admin/chart-data?range=${range}`)
      if (response.ok) {
        const data = await response.json()
        setChartData(data)
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
      // Datos de ejemplo si falla la API
      setChartData([
        { date: "2024-04-01", ventas: 222 },
        { date: "2024-04-02", ventas: 97 },
        { date: "2024-04-03", ventas: 167 },
        { date: "2024-04-04", ventas: 242 },
        { date: "2024-04-05", ventas: 373 },
        { date: "2024-04-06", ventas: 301 },
        { date: "2024-04-07", ventas: 245 },
      ])
    }
  }

  // Función para determinar el color basado en la tendencia
  const getTrendColor = (currentValue, previousValue) => {
    if (!previousValue) return "hsl(217, 91%, 60%)" // Azul por defecto para el primer punto

    const difference = currentValue - previousValue
    const percentageChange = (difference / previousValue) * 100

    if (percentageChange > 5) {
      return "hsl(142, 71%, 45%)" // Verde para subidas significativas (>5%)
    } else if (percentageChange < -5) {
      return "hsl(0, 84%, 60%)" // Rojo para bajadas significativas (<-5%)
    } else {
      return "hsl(45, 93%, 47%)" // Amarillo para cambios menores (±5%)
    }
  }

  // Procesar datos para agregar información de tendencia
  const processedData = chartData.map((item, index) => {
    const previousValue = index > 0 ? chartData[index - 1].ventas : null
    const trendColor = getTrendColor(item.ventas, previousValue)

    return {
      ...item,
      trendColor,
      trend: previousValue ?
        (item.ventas > previousValue ? 'up' : item.ventas < previousValue ? 'down' : 'stable') :
        'neutral'
    }
  })

  const filteredData = processedData

  return (
    <div className="rounded-2xl bg-card overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
      <div className="px-4 py-3 bg-gradient-to-b from-background to-muted/20 border-b border-border/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base tracking-tight">Ventas</h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Mostrando datos de ventas totales con indicadores de tendencia
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[120px] sm:w-[140px] rounded-full border-border/50 bg-background/50 font-medium text-sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Últimos 7 días" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 días
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 días
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="px-4 py-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[200px] sm:h-[250px] w-full">

          <LineChart data={filteredData}>
            <defs>
              <linearGradient id="fillVentas" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(217, 91%, 60%)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(217, 91%, 60%)"
                  stopOpacity={0.01}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.4} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("es-ES", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={3}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-border/50 shadow-xl rounded-xl dark:shadow-none"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("es-ES", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                  formatter={(value, name, props) => {
                    const trend = props.payload.trend
                    const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'
                    return (
                      <div className="flex items-center gap-2 font-bold text-base">
                        <span>{value}€</span>
                        <span className="text-sm font-normal text-muted-foreground">{trendIcon}</span>
                      </div>
                    )
                  }}
                />
              }
            />
            <Area
              dataKey="ventas"
              type="monotone"
              fill="url(#fillVentas)"
              stroke="none"
              animationDuration={1500}
            />
            <Line
              dataKey="ventas"
              type="monotone"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={3}
              dot={(props) => {
                const { key, cx, cy, payload } = props
                return (
                  <circle
                    key={key}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={payload.trendColor}
                    stroke="white"
                    strokeWidth={2}
                  />
                )
              }}
              activeDot={(props) => {
                const { key, cx, cy, payload } = props
                return (
                  <circle
                    key={key}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={payload.trendColor}
                    stroke="white"
                    strokeWidth={3}
                  />
                )
              }}

            />
          </LineChart>
        </ChartContainer>

        {/* Leyenda de colores - oculta en mobile */}
        <div className="hidden sm:flex justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Subida (+5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-muted-foreground">Estable (±5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-muted-foreground">Bajada (-5%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
