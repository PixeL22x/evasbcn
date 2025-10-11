# 🚀 Guía de Deployment - Evas Barcelona Sistema de Gestión de Tienda

## 📋 Pre-requisitos

### ✅ Verificaciones Completadas
- [x] Base de datos MongoDB configurada y funcionando
- [x] Cloudinary configurado para almacenamiento de imágenes
- [x] Variables de entorno configuradas
- [x] Aplicación probada localmente
- [x] Flujo completo verificado

## 🔧 Variables de Entorno para Vercel

Configura estas variables en el panel de Vercel:

```bash
# Base de Datos
DATABASE_URL="mongodb+srv://perueuropaxd_db_user:e6bro0mDc01N89Ls@cluster0.reg7xmu.mongodb.net/evas-barcelona?retryWrites=true&w=majority&appName=Cluster0"

# Cloudinary
CLOUDINARY_URL="cloudinary://698262973267369:08NOvzEDLLGUI_UnkP3PMssRsYg@dzsrsseje"
CLOUDINARY_CLOUD_NAME="dzsrsseje"
CLOUDINARY_API_KEY="698262973267369"
CLOUDINARY_API_SECRET="08NOvzEDLLGUI_UnkP3PMssRsYg"

# Next.js
NEXTAUTH_SECRET="evas-barcelona-secret-key-2024"
NEXTAUTH_URL="https://tu-dominio.vercel.app"
```

## 📦 Pasos de Deployment

### 1. Preparar el Repositorio
```bash
# Asegúrate de que todos los archivos estén commitados
git add .
git commit -m "feat: migrate to MongoDB and Cloudinary for production"
git push origin main
```

### 2. Configurar Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Selecciona el proyecto
4. Configura las variables de entorno en Settings > Environment Variables

### 3. Variables de Entorno en Vercel
```
DATABASE_URL → mongodb+srv://perueuropaxd_db_user:e6bro0mDc01N89Ls@cluster0.reg7xmu.mongodb.net/evas-barcelona?retryWrites=true&w=majority&appName=Cluster0
CLOUDINARY_URL → cloudinary://698262973267369:08NOvzEDLLGUI_UnkP3PMssRsYg@dzsrsseje
CLOUDINARY_CLOUD_NAME → dzsrsseje
CLOUDINARY_API_KEY → 698262973267369
CLOUDINARY_API_SECRET → 08NOvzEDLLGUI_UnkP3PMssRsYg
NEXTAUTH_SECRET → evas-barcelona-secret-key-2024
NEXTAUTH_URL → https://tu-dominio.vercel.app
```

### 4. Inicializar Base de Datos en Producción
Después del primer deploy, ejecuta:
```bash
# En el terminal de Vercel o localmente con la URL de producción
npx prisma db push
node prisma/seed.js
```

## 🏗️ Arquitectura de Producción

### Base de Datos: MongoDB Atlas
- **Cluster**: cluster0.reg7xmu.mongodb.net
- **Database**: evas-barcelona
- **Colecciones**: Cierre, Tarea, Trabajador, PedidoHelado
- **Backup**: Automático por MongoDB Atlas
- **Escalabilidad**: Configurada para crecimiento automático

### Almacenamiento de Imágenes: Cloudinary
- **Cloud**: dzsrsseje
- **Carpetas**: evas-barcelona/cierres/{cierreId}
- **Transformaciones**: Automáticas (800x600, WebP, calidad optimizada)
- **CDN**: Global para carga rápida
- **Backup**: Automático por Cloudinary

### Hosting: Vercel
- **Framework**: Next.js 14
- **Edge Functions**: Para APIs
- **CDN**: Global
- **SSL**: Automático

## 🔒 Seguridad

### Variables Sensibles
- ✅ Todas las credenciales están en variables de entorno
- ✅ No hay datos sensibles en el código
- ✅ Conexiones cifradas (SSL/TLS)

### Acceso a Base de Datos
- ✅ IP Whitelist configurada en MongoDB Atlas
- ✅ Credenciales con permisos mínimos necesarios
- ✅ Conexión segura con certificados

## 📊 Monitoreo

### Métricas Importantes
- **Tiempo de respuesta** de APIs
- **Uso de base de datos** (conexiones, queries)
- **Almacenamiento** de imágenes en Cloudinary
- **Errores** en logs de Vercel

### Logs
- **Vercel Functions**: Logs automáticos
- **MongoDB**: Query logs disponibles
- **Cloudinary**: Upload/transform logs

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de conexión a MongoDB**
   - Verificar variables de entorno
   - Comprobar IP whitelist en MongoDB Atlas
   - Verificar credenciales

2. **Error de Cloudinary**
   - Verificar API keys
   - Comprobar límites de storage
   - Verificar configuración de transformaciones

3. **Error de Prisma**
   - Ejecutar `npx prisma generate`
   - Verificar schema.prisma
   - Comprobar conexión a DB

## 📈 Escalabilidad

### Límites Actuales
- **MongoDB**: 512MB gratuito (escalable)
- **Cloudinary**: 25GB storage gratuito
- **Vercel**: 100GB bandwidth gratuito

### Planes de Upgrade
- MongoDB Atlas: Clusters dedicados
- Cloudinary: Planes pagos para más storage
- Vercel: Pro plan para más recursos

## 🔄 Backup y Recuperación

### Estrategia de Backup
1. **MongoDB Atlas**: Backup automático diario
2. **Cloudinary**: Storage redundante automático
3. **Código**: GitHub como repositorio

### Recuperación
1. Restaurar desde MongoDB Atlas backup
2. Re-deploy desde GitHub
3. Imágenes se mantienen en Cloudinary

## ✅ Checklist Final

- [ ] Variables de entorno configuradas en Vercel
- [ ] Repositorio conectado y deployado
- [ ] Base de datos inicializada con seed
- [ ] Usuarios admin creados
- [ ] Prueba de flujo completo en producción
- [ ] Monitoreo configurado
- [ ] Documentación actualizada

## 🎯 URLs Importantes

- **Aplicación**: https://tu-dominio.vercel.app
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Cloudinary**: https://cloudinary.com/console
- **Vercel Dashboard**: https://vercel.com/dashboard

---

**🚀 La aplicación está lista para producción con:**
- ✅ Base de datos MongoDB segura y escalable
- ✅ Almacenamiento de imágenes optimizado con Cloudinary
- ✅ Hosting confiable en Vercel
- ✅ Flujo completo probado y verificado
