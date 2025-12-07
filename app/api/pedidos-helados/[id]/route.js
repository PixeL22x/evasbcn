import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// PUT - Actualizar estado del pedido
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const { estado, observaciones } = await request.json()

    if (!estado) {
      return NextResponse.json(
        { error: 'Estado es requerido' },
        { status: 400 }
      )
    }

    const estadosValidos = ['pendiente', 'procesado', 'entregado']
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      )
    }

    const updateData = {
      estado,
      observaciones: observaciones || null
    }

    // Si se marca como procesado, actualizar fecha y reducir stock
    if (estado === 'procesado') {
      updateData.fechaProcesado = new Date()
      
      // Obtener el pedido para procesar los sabores
      const pedidoOriginal = await prisma.pedidoHelado.findUnique({
        where: { id },
        include: {
          trabajador: {
            select: { id: true, nombre: true }
          }
        }
      })

      if (pedidoOriginal) {
        try {
          // Procesar los sabores del pedido
          const sabores = JSON.parse(pedidoOriginal.sabores)
          
          for (const sabor of sabores) {
            // Buscar el producto por nombre (asumiendo que el sabor es el nombre del producto)
            const producto = await prisma.producto.findFirst({
              where: { 
                nombre: { 
                  contains: sabor.sabor, 
                  mode: 'insensitive' 
                },
                categoria: 'helados'
              }
            })

            if (producto) {
              // Verificar que hay suficiente stock
              if (producto.stock < sabor.cantidad) {
                return NextResponse.json(
                  { error: `Stock insuficiente para ${sabor.sabor}. Disponible: ${producto.stock}, Requerido: ${sabor.cantidad}` },
                  { status: 400 }
                )
              }

              // Reducir stock del producto
              await prisma.producto.update({
                where: { id: producto.id },
                data: { stock: { decrement: sabor.cantidad } }
              })

              // Registrar movimiento de stock
              await prisma.movimientoStock.create({
                data: {
                  productoId: producto.id,
                  tipo: 'salida',
                  cantidad: sabor.cantidad,
                  motivo: 'venta',
                  trabajadorId: pedidoOriginal.trabajadorId,
                  observaciones: `Pedido #${id} - ${sabor.sabor}`
                }
              })
            }
          }
        } catch (error) {
          console.error('Error procesando stock del pedido:', error)
          // No fallar el pedido si hay error con el stock
        }
      }
    }

    const pedido = await prisma.pedidoHelado.update({
      where: { id },
      data: updateData,
      include: {
        trabajador: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Estado del pedido actualizado exitosamente',
      pedido
    })

  } catch (error) {
    console.error('Error al actualizar pedido:', error)
    return NextResponse.json(
      { error: 'Error al actualizar pedido' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar pedido
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    await prisma.pedidoHelado.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Pedido eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar pedido:', error)
    return NextResponse.json(
      { error: 'Error al eliminar pedido' },
      { status: 500 }
    )
  }
}






