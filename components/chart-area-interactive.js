"use client"

import { useState, useEffect } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
  cierres: {
    label: "Cierres",
    color: "hsl(var(--chart-2))",
  },
}

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = useState("90d")
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
        { date: "2024-04-01", ventas: 222, cierres: 150 },
        { date: "2024-04-02", ventas: 97, cierres: 180 },
        { date: "2024-04-03", ventas: 167, cierres: 120 },
        { date: "2024-04-04", ventas: 242, cierres: 260 },
        { date: "2024-04-05", ventas: 373, cierres: 290 },
        { date: "2024-04-06", ventas: 301, cierres: 340 },
        { date: "2024-04-07", ventas: 245, cierres: 180 },
      ])
    }
  }

  const filteredData = chartData

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Ventas y Cierres</CardTitle>
          <CardDescription>
            Mostrando datos de ventas y cierres completados
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Últimos 3 meses
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Últimos 30 días
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Últimos 7 días
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillVentas" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-ventas)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-ventas)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillCierres" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-cierres)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-cierres)"
                  stopOpacity={0.1}
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
                />
              }
            />
            <Area
              dataKey="cierres"
              type="natural"
              fill="url(#fillCierres)"
              stroke="var(--color-cierres)"
              stackId="a"
            />
            <Area
              dataKey="ventas"
              type="natural"
              fill="url(#fillVentas)"
              stroke="var(--color-ventas)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
