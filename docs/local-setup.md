# 🏠 Configuración Local

Guía para ejecutar la aplicación en tu máquina local.

## 📋 Prerrequisitos

- **Node.js** 18 o superior
- **MongoDB** local o MongoDB Atlas (ver `deploy-mongodb-atlas.md`)
- **Git**
- **npm** o **yarn**

## 🚀 Instalación

### 1. Clonar repositorio

```bash
git clone https://github.com/tu-usuario/medieval-manager.git
cd medieval-manager
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env`:
```bash
cp .env.example .env
```

Editar `.env` con tus valores:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bocadillos
NODE_ENV=development
FRONTEND_URL=http://localhost:4200
```

**Opciones para MongoDB:**

**A) MongoDB Local:**
1. Instala MongoDB Community: https://www.mongodb.com/try/download/community
2. Inicia MongoDB:
   ```bash
   # macOS
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod

   # Windows
   # MongoDB se inicia automáticamente como servicio
   ```
3. Usa: `mongodb://localhost:27017/bocadillos`

**B) MongoDB Atlas (recomendado):**
1. Sigue la guía `deploy-mongodb-atlas.md`
2. Usa tu connection string de Atlas

### 3. Configurar Frontend

```bash
cd ../frontend
npm install
```

Verificar `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

## ▶️ Ejecutar aplicación

### Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Deberías ver:
```
✅ MongoDB conectado correctamente
🚀 Servidor corriendo en puerto 3000
📝 Ambiente: development
🌐 Frontend URL: http://localhost:4200
```

### Frontend (Terminal 2)

```bash
cd frontend
npm start
```

Deberías ver:
```
** Angular Live Development Server is listening on localhost:4200 **
```

### 4. Abrir aplicación

Visita: http://localhost:4200

## 🧪 Probar la aplicación

### 1. Verificar estado de ventana

La aplicación mostrará:
- ✅ **Verde:** Si es lunes-jueves antes de las 17:00 (puedes crear pedidos)
- ⏰ **Amarillo:** Fuera de ventana (solo puedes ver pedidos)

### 2. Crear un bocadillo

Si la ventana está abierta:
1. Rellena el formulario
2. Selecciona ingredientes (aparecerá autocompletado)
3. Click en "Crear Pedido"
4. El bocadillo aparecerá en la lista

### 3. Usar bocata predefinido

1. Selecciona un bocata del dropdown (ej: "Alquimista")
2. El formulario se rellenará automáticamente
3. Puedes modificar ingredientes si quieres
4. Click en "Crear Pedido"

### 4. Eliminar bocadillo

Si la ventana está abierta:
1. Click en el icono de papelera 🗑️
2. Confirma la eliminación

## 📊 Verificar conexiones

### Backend health check
```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Estado de ventana de pedidos
```bash
curl http://localhost:3000/api/menu/order-window
```

### Listar ingredientes
```bash
curl http://localhost:3000/api/menu/ingredientes
```

### Listar bocadillos de la semana
```bash
curl http://localhost:3000/api/bocadillos
```

## 🔧 Comandos útiles

### Backend

```bash
# Desarrollo (con hot reload)
npm run dev

# Build
npm run build

# Producción (requiere build primero)
npm start

# Linter
npm run lint
```

### Frontend

```bash
# Desarrollo
npm start
# o
npm run ng serve

# Build producción
npm run build

# Build con watch
npm run watch

# Tests
npm test
```

## 🐛 Solución de problemas

### Backend no conecta a MongoDB

**Error: "MongoNetworkError"**

**MongoDB Local:**
```bash
# Verificar que MongoDB esté corriendo
# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod

# Reiniciar si es necesario
brew services restart mongodb-community  # macOS
sudo systemctl restart mongod            # Linux
```

**MongoDB Atlas:**
- Verifica que la connection string sea correcta
- Verifica que 0.0.0.0/0 esté permitido en Network Access
- Verifica usuario y contraseña

### Frontend no conecta al backend

**Error: "Failed to fetch"**
- Verifica que el backend esté corriendo en puerto 3000
- Verifica que `apiUrl` en `environment.ts` sea correcta

**Error de CORS:**
- Verifica que `FRONTEND_URL` en backend `.env` sea `http://localhost:4200`
- Reinicia el backend después de cambiar `.env`

### Puerto ya en uso

**Backend (puerto 3000):**
```bash
# Encontrar proceso
lsof -ti:3000

# Matar proceso
kill -9 $(lsof -ti:3000)
```

**Frontend (puerto 4200):**
```bash
# Encontrar proceso
lsof -ti:4200

# Matar proceso
kill -9 $(lsof -ti:4200)
```

### Hot reload no funciona

**Backend:**
- Verifica que `tsx watch` esté funcionando
- Reinicia el servidor manualmente

**Frontend:**
- Angular CLI tiene hot reload por defecto
- Si no funciona, reinicia `npm start`

## 📦 Dependencias principales

### Backend
- **express:** Framework web
- **mongoose:** ODM para MongoDB
- **zod:** Validación de esquemas
- **cors:** Manejo de CORS
- **dotenv:** Variables de entorno
- **tsx:** Ejecutor TypeScript

### Frontend
- **@angular/core:** Framework Angular 19
- **@angular/forms:** Formularios reactivos
- **@angular/common:** Utilidades comunes
- **rxjs:** Programación reactiva

## 🧹 Limpiar y reiniciar

Si algo va mal, prueba:

```bash
# Backend
cd backend
rm -rf node_modules dist
npm install
npm run dev

# Frontend
cd frontend
rm -rf node_modules dist .angular
npm install
npm start
```

## 🔐 Datos de prueba

Para añadir datos de prueba manualmente:

### Usando MongoDB Compass (GUI)
1. Descarga: https://www.mongodb.com/try/download/compass
2. Conecta a tu MongoDB local o Atlas
3. Ve a la colección `bocadillos`
4. Inserta documentos manualmente

### Usando mongo shell
```bash
mongosh

use bocadillos

db.bocadillos.insertOne({
  nombre: "PEPITO",
  tamaño: "normal",
  tipoPan: "integral",
  ingredientes: ["Jamón", "Queso", "Tomate"],
  semana: 1,
  año: 2024,
  fechaCreacion: new Date()
})
```

## 🎯 Siguiente paso

Una vez que funcione localmente, despliega en producción:
1. MongoDB Atlas: `deploy-mongodb-atlas.md`
2. Backend en Render: `deploy-render.md`
3. Frontend en Vercel: `deploy-vercel.md`
