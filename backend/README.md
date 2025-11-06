# 🥖 Backend - Gestor de Pedidos de Bocadillos

API REST con Node.js, Express, TypeScript y MongoDB.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- MongoDB (local o Atlas)

### Instalación

```bash
npm install
```

### Configuración

Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Variables disponibles:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bocadillos
NODE_ENV=development
FRONTEND_URL=http://localhost:4200
```

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm start
```

## 📚 API Endpoints

### Bocadillos

- `GET /api/bocadillos` - Obtener bocadillos de la semana actual
- `POST /api/bocadillos` - Crear nuevo bocadillo (solo lunes-jueves 17:00)
- `DELETE /api/bocadillos/:id` - Eliminar bocadillo (solo lunes-jueves 17:00)

### Menú

- `GET /api/menu/ingredientes` - Obtener lista de ingredientes
- `GET /api/menu/bocatas-predefinidos` - Obtener bocatas predefinidos
- `GET /api/menu/order-window` - Estado de la ventana de pedidos

### Health Check

- `GET /health` - Estado del servidor

## 🔒 Validaciones

- **Ventana de pedidos:** Lunes 00:00 - Jueves 17:00
- **Nombre:** Se guarda en mayúsculas
- **Pan integral/semillas:** Solo tamaño normal
- **Ingredientes:** Mínimo 1, máximo 10

## 🗄️ Modelos de Datos

### Bocadillo
```typescript
{
  nombre: string;           // Mayúsculas
  tamaño: 'normal' | 'grande';
  tipoPan: 'normal' | 'integral' | 'semillas';
  ingredientes: string[];
  bocataPredefinido?: string;
  semana: number;
  año: number;
  fechaCreacion: Date;
}
```

## 🛠️ Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **Base de datos:** MongoDB + Mongoose
- **Validación:** Zod
- **CORS:** Configurado para frontend

## 📦 Despliegue en Render

Ver `/docs/deploy-render.md` para instrucciones detalladas.
