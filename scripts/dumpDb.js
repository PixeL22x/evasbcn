const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando volcado de base de datos...');
  
  const models = [
    'cierre', 'tarea', 'trabajador', 'documento', 'pedidoHelado', 
    'solicitudCambioTurno', 'reglaHorario', 'excepcionHorario', 'producto', 
    'movimientoStock', 'registroTemperatura', 'resena', 'registroHorario', 
    'configuracion', 'ticketDiario', 'saborTarta', 'loteTarta', 'notaAdmin', 
    'proveedor', 'factura', 'lineaFactura', 'tipoMasa', 'loteMasa', 
    'itemCompra', 'tareaAsignada', 'envase', 'recetaEnvase', 'alarmaTimer', 
    'disparoAlarma', 'productoTPV', 'ventaTPV', 'lineaVentaTPV'
  ];

  const dbData = {};

  for (const modelName of models) {
    if (prisma[modelName]) {
      console.log(`Extrayendo datos de ${modelName}...`);
      try {
        dbData[modelName] = await prisma[modelName].findMany();
      } catch (err) {
        console.error(`Error extrayendo ${modelName}:`, err.message);
      }
    } else {
      console.warn(`El modelo ${modelName} no existe en prisma client.`);
    }
  }

  const outputFilename = 'evas_db_dump.json';
  fs.writeFileSync(outputFilename, JSON.stringify(dbData, null, 2), 'utf-8');
  console.log(`Volcado completado y guardado en ${outputFilename}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
