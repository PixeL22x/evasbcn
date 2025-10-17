import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// Verificar si estamos en un entorno serverless (Vercel)
const isServerless = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

// GET - Obtener información de backups y configuración o descargar backup
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const downloadFile = searchParams.get('download')

    // Si se solicita descarga de un archivo específico
    if (downloadFile) {
      const backupDir = path.join(process.cwd(), 'backups')
      const filePath = path.join(backupDir, downloadFile)
      
      // Verificar que el archivo existe y es un backup válido
      if (!fs.existsSync(filePath) || !downloadFile.endsWith('.json') || !downloadFile.startsWith('backup-')) {
        return NextResponse.json({ error: 'Archivo de backup no encontrado' }, { status: 404 })
      }

      // Leer el archivo y devolverlo como descarga
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const stats = fs.statSync(filePath)
      
      return new NextResponse(fileContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${downloadFile}"`,
          'Content-Length': stats.size.toString(),
        },
      })
    }

    // Verificar si existe el directorio de backups
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Obtener lista de archivos de backup
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json') && file.startsWith('backup-'))
      .map(file => {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        }
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created))

    // Leer configuración de backup (si existe)
    const configPath = path.join(backupDir, 'backup-config.json')
    let config = {
      autoBackup: false,
      interval: 'daily', // daily, weekly, monthly
      lastBackup: null,
      maxBackups: 10
    }

    if (fs.existsSync(configPath)) {
      try {
        const configData = fs.readFileSync(configPath, 'utf8')
        config = { ...config, ...JSON.parse(configData) }
      } catch (error) {
        console.error('Error reading backup config:', error)
      }
    }

    return NextResponse.json({
      backups: backupFiles,
      config,
      totalBackups: backupFiles.length
    })

  } catch (error) {
    console.error('Error getting backup info:', error)
    return NextResponse.json({ error: 'Error al obtener información de backups' }, { status: 500 })
  }
}

// POST - Crear backup manual o actualizar configuración
export async function POST(request) {
  try {
    const { action, config } = await request.json()

    if (action === 'create') {
      // Crear backup manual
      const backup = await createBackup()
      return NextResponse.json({ 
        message: 'Backup creado exitosamente', 
        backup,
        isServerless: isServerless
      })
    }

    if (action === 'update-config') {
      // Actualizar configuración
      const backupDir = path.join(process.cwd(), 'backups')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }

      const configPath = path.join(backupDir, 'backup-config.json')
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

      return NextResponse.json({ 
        message: 'Configuración actualizada exitosamente' 
      })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  } catch (error) {
    console.error('Error in backup operation:', error)
    return NextResponse.json({ error: 'Error en la operación de backup' }, { status: 500 })
  }
}

// Función para crear backup
async function createBackup() {
  try {
    // Obtener todos los datos de la base de datos
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        trabajadores: await prisma.trabajador.findMany(),
        cierres: await prisma.cierre.findMany({
          include: {
            tareas: true
          }
        }),
        reglasHorario: await prisma.reglaHorario.findMany(),
        excepcionesHorario: await prisma.excepcionHorario.findMany(),
        productos: await prisma.producto.findMany(),
        movimientosStock: await prisma.movimientoStock.findMany(),
        registrosTemperatura: await prisma.registroTemperatura.findMany(),
        pedidosHelados: await prisma.pedidoHelado.findMany(),
        solicitudesCambioTurno: await prisma.solicitudCambioTurno.findMany()
      }
    }

    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `backup-${timestamp}.json`

    if (isServerless) {
      // En producción (Vercel), devolver el backup como JSON directamente
      const jsonData = JSON.stringify(backupData, null, 2)
      
      return {
        filename,
        size: Buffer.byteLength(jsonData, 'utf8'),
        created: new Date().toISOString(),
        data: jsonData, // Incluir los datos para descarga directa
        isServerless: true
      }
    } else {
      // En localhost, guardar archivo como antes
      const backupDir = path.join(process.cwd(), 'backups')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }

      // Guardar backup
      const filePath = path.join(backupDir, filename)
      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2))

      // Actualizar configuración con último backup
      const configPath = path.join(backupDir, 'backup-config.json')
      let config = {
        autoBackup: false,
        interval: 'daily',
        lastBackup: new Date().toISOString(),
        maxBackups: 10
      }

      if (fs.existsSync(configPath)) {
        try {
          const configData = fs.readFileSync(configPath, 'utf8')
          config = { ...config, ...JSON.parse(configData) }
        } catch (error) {
          console.error('Error reading backup config:', error)
        }
      }

      config.lastBackup = new Date().toISOString()
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

      // Limpiar backups antiguos si excede el máximo
      await cleanupOldBackups(backupDir, config.maxBackups)

      return {
        filename,
        size: fs.statSync(filePath).size,
        created: new Date().toISOString(),
        isServerless: false
      }
    }

  } catch (error) {
    console.error('Error creating backup:', error)
    throw error
  }
}

// Función para limpiar backups antiguos
async function cleanupOldBackups(backupDir, maxBackups) {
  try {
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json') && file.startsWith('backup-'))
      .map(file => {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        return {
          filename: file,
          created: stats.birthtime
        }
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created))

    // Eliminar backups que excedan el máximo
    if (backupFiles.length > maxBackups) {
      const filesToDelete = backupFiles.slice(maxBackups)
      for (const file of filesToDelete) {
        const filePath = path.join(backupDir, file.filename)
        fs.unlinkSync(filePath)
        console.log(`Deleted old backup: ${file.filename}`)
      }
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error)
  }
}
