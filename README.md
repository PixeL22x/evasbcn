# 🍦 Evas Barcelona - Sistema de Cierre Gamificado

Una aplicación web gamificada para el proceso de cierre de la heladería Evas Barcelona, desarrollada con Next.js 13+ y Prisma.

## ✨ Características

- **🎮 Gamificación**: Interfaz atractiva y moderna con temporizadores circulares
- **📱 Responsive**: Optimizado para móvil, tablet y desktop
- **⏱️ Temporizador**: Cronómetro circular para cada tarea con tiempo estimado
- **📊 Estadísticas**: Panel de administración con historial de cierres
- **🗄️ Base de Datos**: Persistencia con SQLite y Prisma ORM
- **👥 Gestión de Trabajadores**: Sistema de identificación de empleados

## 🚀 Tecnologías

- **Frontend**: Next.js 13+ con App Router
- **Styling**: Tailwind CSS
- **Base de Datos**: SQLite con Prisma ORM
- **Bundler**: Turbopack para desarrollo rápido
- **Deployment**: Vercel (recomendado)

## 📋 Tareas del Cierre (14 tareas - 30 minutos)

1. 💡 Apagar luces todas menos blancas (2 min)
2. 📋 Meter carteles (3 min)
3. 🚪 Cerrar puerta y persiana (2 min)
4. 🗑️ Sacar basura (3 min)
5. 🧽 Limpiar con esponja lugar de cucharas ISA (4 min)
6. ❄️ Guardar smoothies a Nevera blanca (3 min)
7. 🍢 Sacar pinchos (2 min)
8. 🍦 Tapar helados (3 min)
9. 📦 Guardar helados repetidos a arcon (4 min)
10. 🍴 Sacar cucharas y pinchos a secar (2 min)
11. 📝 Apuntar info cierre en libreta, imprimir, grapar (3 min)
12. 📸 Enviar foto de maquinas apagadas (gofre, aire) (2 min)
13. 💳 Apagar y cargar datafonos (2 min)
14. 🔌 Apagar justeat, tpv, ventilador de techo (3 min)

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/evas-barcelona-cierre.git
   cd evas-barcelona-cierre
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar la base de datos**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 📱 Uso

### Para Trabajadores
1. Seleccionar tu nombre (Julia, Alejandra, Martina)
2. Completar las 14 tareas secuencialmente
3. Cada tarea tiene un temporizador estimado
4. Marcar "✅ OK" cuando completes cada tarea
5. El sistema avanza automáticamente a la siguiente

### Para Administradores
1. Acceder a "📊 Estadísticas" desde la pantalla principal
2. Ver historial de todos los cierres
3. Consultar tiempos reales y progreso
4. Eliminar cierres si es necesario

## 🚀 Despliegue en Vercel

1. **Conectar con GitHub**
   - Subir el código a tu repositorio de GitHub
   - Conectar Vercel con tu repositorio

2. **Configurar variables de entorno**
   ```
   DATABASE_URL="file:./dev.db"
   ```

3. **Desplegar**
   - Vercel detectará automáticamente que es un proyecto Next.js
   - El despliegue se realizará automáticamente

## 📁 Estructura del Proyecto

```
evas-barcelona-cierre/
├── app/
│   ├── api/
│   │   ├── cierre/
│   │   └── tarea/
│   ├── admin/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   ├── CircularTimer.js
│   ├── SequentialTask.js
│   └── WorkerForm.js
├── lib/
│   └── prisma.js
├── prisma/
│   └── schema.prisma
└── README.md
```

## 🎯 Funcionalidades Principales

- **Flujo Secuencial**: Las tareas deben completarse en orden
- **Temporizador Inteligente**: Cronómetro circular con colores según progreso
- **Navegación**: Botones para avanzar y retroceder entre tareas
- **Persistencia**: Todas las acciones se guardan en la base de datos
- **Estadísticas**: Panel de administración con métricas detalladas
- **Responsive**: Adaptado para todos los dispositivos

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo con Turbopack
- `npm run build` - Construir para producción
- `npm run start` - Servidor de producción
- `npm run lint` - Linter de código

## 📊 Base de Datos

### Modelos
- **Cierre**: Información del cierre (trabajador, fechas, estado)
- **Tarea**: Tareas individuales del cierre (nombre, duración, completada)

### Relaciones
- Un cierre tiene muchas tareas
- Las tareas pertenecen a un cierre

## 🎨 Diseño

- **Paleta de colores**: Gradientes azul-púrpura con acentos verdes
- **Tipografía**: Fuentes modernas y legibles
- **Iconos**: Emojis representativos para cada tarea
- **Animaciones**: Transiciones suaves y efectos visuales
- **Glassmorphism**: Efectos de cristal para elementos UI

## 📱 Compatibilidad

- **Móvil**: iPhone, Android (optimizado)
- **Tablet**: iPad, Android tablets
- **Desktop**: Windows, macOS, Linux
- **Navegadores**: Chrome, Firefox, Safari, Edge

## 🤝 Contribuciones

Este es un proyecto privado para Evas Barcelona. Para sugerencias o mejoras, contactar con el equipo de desarrollo.

## 📄 Licencia

Proyecto privado - Evas Barcelona © 2024

---

**Desarrollado con ❤️ para Evas Barcelona** 🍦