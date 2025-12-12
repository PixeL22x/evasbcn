'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function LowStockAlert() {
    const [lowStockProducts, setLowStockProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStock = async () => {
            try {
                const response = await fetch('/api/stock')
                const data = await response.json()

                // Filter products with low stock
                const critical = data.filter(p => p.stock <= p.stockMinimo)
                setLowStockProducts(critical)
            } catch (error) {
                console.error('Error fetching stock:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStock()
    }, [])

    if (loading) return null // Don't show anything while loading to avoid layout shift, or show skeleton

    if (lowStockProducts.length === 0) return null // No alerts needed

    return (
        <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-orange-700">
                        <AlertTriangle className="h-5 w-5" />
                        <CardTitle className="text-lg">Alerta de Stock Bajo</CardTitle>
                    </div>
                    <Link href="/admin/stock">
                        <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-800 hover:bg-orange-100">
                            Gestionar Stock <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
                <CardDescription className="text-orange-600/90">
                    Hay {lowStockProducts.length} productos por debajo del mínimo establecido.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {lowStockProducts.slice(0, 6).map((product) => (
                        <div
                            key={product.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white border border-orange-100 shadow-sm"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-1.5 rounded-full ${product.stock === 0 ? 'bg-red-100' : 'bg-orange-100'}`}>
                                    <Package className={`h-4 w-4 ${product.stock === 0 ? 'text-red-600' : 'text-orange-600'}`} />
                                </div>
                                <div className="truncate">
                                    <p className="text-sm font-medium text-gray-900 truncate">{product.nombre}</p>
                                    <p className="text-xs text-gray-500 capitalize">{product.categoria}</p>
                                </div>
                            </div>
                            <div className="text-right pl-2">
                                <span className={`text-sm font-bold ${product.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                    {product.stock}
                                </span>
                                <span className="text-xs text-gray-400 block">/ {product.stockMinimo}</span>
                            </div>
                        </div>
                    ))}
                    {lowStockProducts.length > 6 && (
                        <div className="flex items-center justify-center p-2 text-sm text-orange-700 font-medium">
                            + {lowStockProducts.length - 6} más...
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
