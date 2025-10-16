import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { trabajador, turno, totalVentas } = await request.json()

    // Simular datos de prueba
    const datosPrueba = {
      cierreId: 'test_' + Date.now(),
      trabajador: trabajador || 'Piero',
      turno: turno || 'tarde',
      totalVentas: totalVentas || '245.50',
      fechaFin: new Date().toISOString()
    }

    // Enviar notificación de prueba
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/telegram/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosPrueba)
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Notificación de prueba enviada',
      datosEnviados: datosPrueba,
      resultado: result
    })

  } catch (error) {
    console.error('Error enviando notificación de prueba:', error)
    return NextResponse.json({
      success: false,
      message: 'Error enviando notificación de prueba',
      error: error.message
    }, { status: 500 })
  }
}
