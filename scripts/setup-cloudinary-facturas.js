// Script para crear el upload preset de facturas en Cloudinary
const https = require('https');

const CLOUDINARY_CLOUD_NAME = 'dzsrssexx';
const CLOUDINARY_API_KEY = '964275479611694';
const CLOUDINARY_API_SECRET = '_unKuTKBCnxiiSloeWPGKm06h9k';

const presetData = JSON.stringify({
    name: 'facturas',
    unsigned: true,
    folder: 'facturas',
    unique_filename: true,
    overwrite: false,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    tags: ['factura', 'invoice']
});

const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString('base64');

const options = {
    hostname: 'api.cloudinary.com',
    port: 443,
    path: `/v1_1/${CLOUDINARY_CLOUD_NAME}/upload_presets`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': presetData.length,
        'Authorization': `Basic ${auth}`
    }
};

console.log('🔧 Creando upload preset "facturas" en Cloudinary...\n');

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Upload preset "facturas" creado exitosamente!\n');
            console.log('📋 Configuración:');
            console.log('   - Nombre: facturas');
            console.log('   - Modo: Unsigned (permite uploads desde cliente)');
            console.log('   - Carpeta: facturas/');
            console.log('   - Formatos: JPG, PNG, WEBP');
            console.log('\n🚀 Ya puedes usar el escaneo de facturas!\n');
        } else if (res.statusCode === 409) {
            console.log('ℹ️  El preset "facturas" ya existe en Cloudinary');
            console.log('✅ No es necesario crearlo de nuevo\n');
        } else {
            console.error('❌ Error al crear preset:', res.statusCode);
            console.error('Respuesta:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
});

req.write(presetData);
req.end();
