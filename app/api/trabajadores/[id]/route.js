import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'

// DELETE - Eliminar trabajador
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID del trabajador es requerido' },
        { status: 400 }
      )
    }

    // Verificar si el trabajador existe
    const trabajador = await prisma.trabajador.findUnique({
      where: { id }
    })

    if (!trabajador) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar trabajador
    await prisma.trabajador.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Trabajador eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar trabajador:', error)
    return NextResponse.json(
      { error: 'Error al eliminar trabajador' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar trabajador
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      nombre, password, activo,
      email, telefono, direccion, cargo, dni, nss, iban, salarioHora, notasAdmin
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID del trabajador es requerido' },
        { status: 400 }
      )
    }

    // Verificar si el trabajador existe
    const trabajador = await prisma.trabajador.findUnique({
      where: { id }
    })

    if (!trabajador) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos para actualizar
    const updateData = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (activo !== undefined) updateData.activo = activo

    // Hash de la contraseña si se proporciona
    if (password !== undefined && password !== '') {
      const saltRounds = 12
      updateData.password = await bcrypt.hash(password, saltRounds)
    }

    // HR Fields update
    if (email !== undefined) updateData.email = email
    if (telefono !== undefined) updateData.telefono = telefono
    if (direccion !== undefined) updateData.direccion = direccion
    if (cargo !== undefined) updateData.cargo = cargo
    if (dni !== undefined) updateData.dni = dni
    if (nss !== undefined) updateData.nss = nss
    if (iban !== undefined) updateData.iban = iban
    if (salarioHora !== undefined) updateData.salarioHora = parseFloat(salarioHora)
    if (notasAdmin !== undefined) updateData.notasAdmin = notasAdmin

    // Explicit baja handling
    if (body.fechaBaja !== undefined) {
      updateData.fechaBaja = body.fechaBaja ? new Date(body.fechaBaja) : null
    }

    // Actualizar trabajador
    const trabajadorActualizado = await prisma.trabajador.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Trabajador actualizado exitosamente',
      trabajador: trabajadorActualizado // Return full object so UI updates correctly
    })

  } catch (error) {
    console.error('Error al actualizar trabajador:', error)
    return NextResponse.json(
      { error: 'Error al actualizar trabajador' },
      { status: 500 }
    )
  }
}

