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
      return "hsl(217, 91%, 60%)" // Azul para subidas significativas (>5%)
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
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Ventas</CardTitle>
          <CardDescription>
            Mostrando datos de ventas totales con indicadores de tendencia
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Últimos 7 días" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
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
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart data={filteredData}>
            <defs>
              <linearGradient id="fillVentas" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(217, 91%, 60%)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(217, 91%, 60%)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
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
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("es-ES", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                  formatter={(value, name, props) => {
                    const trend = props.payload.trend
                    const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'
                    return [`${value}€ ${trendIcon}`, name]
                  }}
                />
              }
            />
            <Area
              dataKey="ventas"
              type="natural"
              fill="url(#fillVentas)"
              stroke="none"
            />
            <Line
              dataKey="ventas"
              type="natural"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={3}
              dot={(props) => {
                const { cx, cy, payload } = props
                return (
                  <circle
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
                const { cx, cy, payload } = props
                return (
                  <circle
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
        
        {/* Leyenda de colores */}
        <div className="flex justify-center gap-4 mt-4 text-sm">
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
      </CardContent>
    </Card>
  )
}
