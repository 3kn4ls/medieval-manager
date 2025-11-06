# 🚀 Despliegue del Backend en Render

Render ofrece 750 horas mensuales gratis, perfecto para este proyecto.

## 📋 Prerrequisitos

1. Cuenta en MongoDB Atlas configurada (ver `deploy-mongodb-atlas.md`)
2. Código del backend en GitHub
3. Cuenta en Render (https://render.com)

## 🚀 Pasos para desplegar

### 1. Crear cuenta en Render

1. Ve a https://render.com
2. Click en **Get Started**
3. Regístrate con GitHub (recomendado) o email

### 2. Conectar repositorio de GitHub

1. En el dashboard de Render, autoriza acceso a tus repositorios
2. Selecciona el repositorio de tu proyecto

### 3. Crear Web Service

1. Click en **New +** > **Web Service**
2. Selecciona tu repositorio
3. Configura el servicio:

**Configuración básica:**
- **Name:** `bocadillos-backend` (o el nombre que prefieras)
- **Region:** Selecciona la más cercana (Europe - Frankfurt)
- **Branch:** `main` o tu rama principal
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:**
  ```bash
  npm install && npm run build
  ```
- **Start Command:**
  ```bash
  npm start
  ```

**Plan:**
- Selecciona **Free** (750 horas/mes)

### 4. Configurar Variables de Entorno

En la sección **Environment**, añade estas variables:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://tuusuario:tupassword@cluster0.xxxxx.mongodb.net/bocadillos?retryWrites=true&w=majority
FRONTEND_URL=https://tu-frontend.vercel.app
```

**Importante:**
- `MONGODB_URI`: Tu connection string de MongoDB Atlas
- `FRONTEND_URL`: La URL de tu frontend en Vercel (la configurarás después)

### 5. Deploy

1. Click en **Create Web Service**
2. Render empezará a construir y desplegar tu aplicación
3. Espera a que el build termine (2-5 minutos)
4. Verás el estado **Live** cuando esté listo

### 6. Obtener la URL

Tu backend estará disponible en:
```
https://bocadillos-backend.onrender.com
```

Guarda esta URL, la necesitarás para configurar el frontend.

## ✅ Verificar funcionamiento

1. Visita: `https://tu-backend.onrender.com/health`
2. Deberías ver:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-01T12:00:00.000Z"
   }
   ```

## 📊 Endpoints disponibles

Una vez desplegado, estos endpoints estarán disponibles:

- `GET /health` - Health check
- `GET /api/bocadillos` - Listar bocadillos de la semana
- `POST /api/bocadillos` - Crear bocadillo (solo lunes-jueves 17:00)
- `DELETE /api/bocadillos/:id` - Eliminar bocadillo (solo lunes-jueves 17:00)
- `GET /api/menu/ingredientes` - Listar ingredientes
- `GET /api/menu/bocatas-predefinidos` - Listar bocatas predefinidos
- `GET /api/menu/order-window` - Estado de ventana de pedidos

## 🔄 Actualizaciones automáticas

Render detecta automáticamente cambios en tu repositorio:
1. Haz push a tu rama principal
2. Render construirá y desplegará automáticamente
3. El proceso tarda 2-5 minutos

## ⚡ Sobre el plan gratuito

**Características:**
- 750 horas/mes (suficiente para 24/7)
- 512 MB RAM
- El servicio se "duerme" tras 15 minutos de inactividad
- Primera petición tras inactividad tarda ~30 segundos

**Límites:**
- Si superas 750 horas/mes, el servicio se pausará
- Se reinicia automáticamente el 1 de cada mes

## 🐛 Solución de problemas

### Build falla

**Error: "Cannot find module"**
```bash
# Verifica que package.json tenga todas las dependencias
cd backend
npm install
npm run build
```

**Error: "Root Directory not found"**
- Asegúrate de que **Root Directory** sea `backend`

### La aplicación no inicia

**Error de MongoDB**
- Verifica que `MONGODB_URI` sea correcta
- Comprueba que MongoDB Atlas permita conexiones desde 0.0.0.0/0

**Puerto incorrecto**
- Render usa la variable `PORT` automáticamente
- No es necesario cambiarla

### El servicio está "sleeping"

Esto es normal en el plan gratuito:
- Primera petición tras inactividad tarda ~30s
- El servicio se reactiva automáticamente
- Considera usar un servicio de "ping" para mantenerlo activo (opcional)

## 📈 Monitoreo

En el dashboard de Render puedes ver:
- **Logs en tiempo real**
- **Métricas de CPU y memoria**
- **Estado del servicio**
- **Historial de deploys**

## 🔒 Seguridad

**Recomendaciones:**
- ✅ Usa variables de entorno para secretos
- ✅ Configura CORS correctamente con `FRONTEND_URL`
- ✅ Nunca subas `.env` a GitHub
- ✅ Usa HTTPS (Render lo proporciona automáticamente)

## 💡 Mejoras opcionales

### Custom Domain
Render permite añadir tu propio dominio gratuitamente:
1. Ve a **Settings** > **Custom Domain**
2. Añade tu dominio
3. Configura DNS según las instrucciones

### Mantener el servicio activo
Para evitar el "sleep", usa un servicio de ping:
- https://uptimerobot.com (gratuito)
- Configura un monitor HTTP cada 5 minutos a `/health`

## 🔗 Siguiente paso

Ahora despliega el frontend en Vercel: ver `deploy-vercel.md`
