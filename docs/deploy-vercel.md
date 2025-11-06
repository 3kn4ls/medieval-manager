# 🚀 Despliegue del Frontend en Vercel

Vercel ofrece despliegue gratuito e ilimitado para proyectos de frontend.

## 📋 Prerrequisitos

1. Backend desplegado en Render (ver `deploy-render.md`)
2. Código del frontend en GitHub
3. Cuenta en Vercel (https://vercel.com)

## 🚀 Pasos para desplegar

### 1. Crear cuenta en Vercel

1. Ve a https://vercel.com/signup
2. Click en **Continue with GitHub** (recomendado)
3. Autoriza a Vercel a acceder a tus repositorios

### 2. Importar proyecto

1. En el dashboard, click en **Add New...** > **Project**
2. Busca tu repositorio `medieval-manager`
3. Click en **Import**

### 3. Configurar el proyecto

**Configuración básica:**
- **Framework Preset:** Vercel detectará Angular automáticamente
- **Root Directory:** `frontend`
- **Build Command:**
  ```bash
  npm install && npm run build
  ```
- **Output Directory:** `dist/bocadillos-frontend/browser`
- **Install Command:** `npm install`

### 4. Configurar Variables de Entorno

En la sección **Environment Variables**, añade:

**Variable:** `API_URL`
**Value:** `https://tu-backend.onrender.com/api`
(Reemplaza con tu URL de Render)

**Ambientes:** Production, Preview, Development

### 5. Actualizar configuración de Angular

Antes de desplegar, necesitas configurar la URL de la API para producción.

Edita `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-backend.onrender.com/api',
};
```

**Importante:** Reemplaza `tu-backend.onrender.com` con tu URL real de Render.

Haz commit y push de este cambio:

```bash
git add frontend/src/environments/environment.prod.ts
git commit -m "Configure production API URL"
git push
```

### 6. Deploy

1. Click en **Deploy**
2. Vercel construirá tu aplicación (2-3 minutos)
3. Una vez completado, verás el estado **Ready**

### 7. Obtener la URL

Tu frontend estará disponible en:
```
https://medieval-manager.vercel.app
```

O un nombre similar generado por Vercel.

## 🔄 Actualizar URL en Backend

Ahora necesitas actualizar la variable `FRONTEND_URL` en Render:

1. Ve a tu servicio de backend en Render
2. Ve a **Environment**
3. Edita `FRONTEND_URL`
4. Cambia el valor a tu URL de Vercel: `https://tu-app.vercel.app`
5. Guarda los cambios
6. El servicio se reiniciará automáticamente

## ✅ Verificar funcionamiento

1. Visita tu URL de Vercel
2. Deberías ver la aplicación funcionando
3. Verifica que:
   - Se muestra el estado de la ventana de pedidos
   - Se carga la lista de pedidos (aunque esté vacía)
   - El formulario aparece si es lunes-jueves antes de las 17:00

## 🔧 Configuración avanzada

### Custom Domain

Puedes añadir tu propio dominio gratuitamente:

1. Ve a **Settings** > **Domains**
2. Click en **Add**
3. Ingresa tu dominio (ej: `bocadillos.miempresa.com`)
4. Sigue las instrucciones de configuración DNS

### Build Optimization

Angular 19 incluye optimizaciones automáticas, pero puedes ajustar:

**Configuración de build en `vercel.json`** (opcional):

Crea `frontend/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/bocadillos-frontend/browser",
  "framework": "angular",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Variables de entorno por ambiente

Puedes tener diferentes URLs para:
- **Production:** Tu backend en Render
- **Preview:** Backend de staging
- **Development:** `http://localhost:3000/api`

## 🔄 Despliegues automáticos

Vercel despliega automáticamente:
- **Production:** Cada push a la rama `main`
- **Preview:** Cada push a otras ramas o Pull Requests

Esto significa:
1. Haces cambios en tu código
2. Haces push a GitHub
3. Vercel detecta el cambio y despliega automáticamente
4. Recibes una URL de preview para cada PR

## 📊 Métricas y Analytics

En el dashboard de Vercel puedes ver:
- **Build logs**
- **Deployment history**
- **Domain analytics** (opcional, plan Pro)
- **Function logs** (si usas Vercel Functions)

## 🐛 Solución de problemas

### Build falla

**Error: "Output directory not found"**
```bash
# Verifica la ruta de output localmente
cd frontend
npm run build
ls -la dist/
```

La estructura debería ser:
```
dist/
└── bocadillos-frontend/
    └── browser/
        ├── index.html
        └── ...
```

**Error: "Module not found"**
- Verifica que todas las dependencias estén en `package.json`
- No uses `devDependencies` para dependencias de runtime

### La aplicación no se conecta al backend

**Error de CORS:**
- Verifica que `FRONTEND_URL` en Render sea correcta
- Debe incluir `https://` y no terminar en `/`
- Formato: `https://tu-app.vercel.app`

**Error: "Failed to fetch"**
- Verifica que `apiUrl` en `environment.prod.ts` sea correcta
- Debe incluir `https://` y terminar con `/api` (sin barra final después de api)
- Formato: `https://tu-backend.onrender.com/api`

**Backend dormido:**
- En el plan gratuito de Render, la primera petición puede tardar 30s
- Esto es normal, no es un error

### Rutas 404

Si al recargar la página ves 404:
- Asegúrate de tener configurado el `vercel.json` con rewrites
- O configura en Vercel dashboard: **Settings** > **Rewrites**

## 🔒 Seguridad

**Recomendaciones:**
- ✅ Usa HTTPS (Vercel lo proporciona automáticamente)
- ✅ Configura CORS correctamente en el backend
- ✅ No expongas claves API en el frontend
- ✅ Usa variables de entorno para URLs

## 💡 Características del plan gratuito

- ✅ Despliegues ilimitados
- ✅ 100 GB de bandwidth/mes
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Previews automáticos de PR
- ✅ Custom domains

Perfecto para este proyecto.

## 📱 Progressive Web App (PWA)

Si quieres convertir la app en PWA (opcional):

1. Usa Angular Service Worker
2. Los usuarios podrán "instalarla" en sus dispositivos
3. Funcionará offline (con caché)

## 🎉 ¡Listo!

Tu aplicación está completamente desplegada:
- ✅ Frontend en Vercel
- ✅ Backend en Render
- ✅ Base de datos en MongoDB Atlas

Comparte la URL con tu equipo y ¡a disfrutar de los bocadillos!

## 🔗 Recursos adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Angular en Vercel](https://vercel.com/guides/deploying-angular-with-vercel)
- [Vercel CLI](https://vercel.com/docs/cli) para deploys desde terminal
