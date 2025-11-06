# 🥖 Frontend - Gestor de Pedidos de Bocadillos

Aplicación Angular 19 standalone para gestionar pedidos de bocadillos.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- Angular CLI 19

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`

### Producción

```bash
npm run build
```

Los archivos compilados estarán en `dist/`

## ✨ Características

- **Formulario completo** con validaciones
- **Autocompletado** de ingredientes
- **Bocatas predefinidos** para selección rápida
- **Restricciones de negocio:** Pan integral/semillas solo tamaño normal
- **Ventana temporal:** Solo permite pedidos lunes-jueves 17:00
- **Lista de pedidos** de la semana actual
- **Responsive design** para móviles y tablets

## 🏗️ Arquitectura

- **Componentes standalone** (Angular 19)
- **Signals** para estado reactivo
- **HttpClient** para comunicación con API
- **Reactive Forms** para formularios
- **CSS personalizado** con variables

## 📁 Estructura

```
src/
├── app/
│   ├── components/
│   │   ├── bocadillo-form/     # Formulario de pedidos
│   │   └── bocadillo-list/      # Lista de pedidos
│   ├── models/                  # Interfaces TypeScript
│   ├── services/                # Servicios HTTP
│   ├── app.component.*          # Componente principal
│   └── app.config.ts            # Configuración
├── environments/                # Variables de entorno
├── styles.css                   # Estilos globales
└── main.ts                      # Punto de entrada
```

## 🔧 Configuración

Edita `src/environments/environment.ts` para desarrollo:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

Para producción, edita `src/environments/environment.prod.ts`

## 📦 Despliegue en Vercel

Ver `/docs/deploy-vercel.md` para instrucciones detalladas.

## 🎨 Personalización

Los estilos globales están en `src/styles.css` con variables CSS:

```css
:root {
  --primary-color: #2c3e50;
  --secondary-color: #3498db;
  --success-color: #27ae60;
  --danger-color: #e74c3c;
}
```
