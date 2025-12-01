# Configuración de Variables VAPID en Render

## ℹ️ Actualización Importante

**El servidor ahora puede arrancar sin las claves VAPID configuradas.**

Las notificaciones push estarán simplemente deshabilitadas hasta que configures las variables de entorno. Esto significa que:
- ✅ El backend desplegará correctamente sin VAPID
- ⚠️ El endpoint `/api/push/vapid-public-key` devolverá un error 503 (Service Unavailable)
- 📱 Los usuarios verán un mensaje claro indicando que las notificaciones no están disponibles
- 🔧 Puedes configurar VAPID en cualquier momento después del deploy

---

## Problema
El error 503 en `/api/push/vapid-public-key` indica que las variables de entorno VAPID no están configuradas en Render.

## Solución: Configurar Variables de Entorno en Render

### Paso 1: Acceder al Dashboard de Render
1. Ve a https://dashboard.render.com
2. Selecciona tu servicio `bocadillos-backend`

### Paso 2: Agregar Variables de Entorno
1. Click en la pestaña **"Environment"** en el menú lateral
2. Scroll hacia abajo hasta la sección **"Environment Variables"**
3. Agrega las siguientes 3 variables:

#### Variable 1: VAPID_PUBLIC_KEY
```
Key: VAPID_PUBLIC_KEY
Value: BEx_EZ41ZqRbl93-c2A26w1KZ4QDx1ttj4A6y9uMRjZPByV_mgA2HZ9fgFXRK3pjyYoZOW_-8WT4F8cE82w3-y0
```

#### Variable 2: VAPID_PRIVATE_KEY
```
Key: VAPID_PRIVATE_KEY
Value: 60p2sKk4EeVMHzYjImn6F75f42ZVpJj1FfSdKTfxM4M
```

#### Variable 3: VAPID_SUBJECT
```
Key: VAPID_SUBJECT
Value: mailto:admin@medievalmanager.com
```

### Paso 3: Guardar y Redeploy
1. Click en **"Save Changes"**
2. Render automáticamente reiniciará tu servicio (~2-3 minutos)
3. Espera a que el estado sea **"Live"** con un círculo verde

### Paso 4: Verificar
1. Abre tu aplicación frontend
2. Intenta activar las notificaciones push
3. El endpoint `/api/push/vapid-public-key` ahora debería responder correctamente

---

## Notas Importantes

### ⚠️ Seguridad de las Claves
- Las claves VAPID incluidas arriba son las generadas para tu aplicación
- Estas claves son seguras de exponer (la pública se envía al frontend)
- Si quieres regenerar nuevas claves, ejecuta en tu backend local:
  ```bash
  npm install -g web-push
  web-push generate-vapid-keys
  ```

### 🔄 Verificación del Deploy
Para verificar que Render tiene la última versión del código:
1. Ve a **"Logs"** en Render
2. Busca líneas como:
   ```
   npm install && npm run build
   > tsc
   Build succeeded
   ```
3. Si ves errores de TypeScript, el build falló y está usando una versión anterior

### 📋 Checklist de Variables de Entorno en Render
Asegúrate de tener TODAS estas variables configuradas:
- [ ] NODE_ENV=production
- [ ] PORT=3000
- [ ] MONGODB_URI=[tu connection string]
- [ ] FRONTEND_URL=[URL de Vercel]
- [ ] VAPID_PUBLIC_KEY=[la clave de arriba]
- [ ] VAPID_PRIVATE_KEY=[la clave de arriba]
- [ ] VAPID_SUBJECT=mailto:admin@medievalmanager.com

---

## Problema del Sistema de Cierre de Pedidos

Si después de guardar la configuración de cierre, los pedidos siguen permitidos:

### Causas Posibles:
1. **Render no tiene el código actualizado**: Verifica que el último commit esté desplegado
2. **Cache del navegador**: Haz Ctrl+Shift+R (force refresh) en el frontend
3. **MongoDB tiene múltiples documentos Settings**: Solo debería haber uno

### Verificación:
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Network**
3. Guarda la configuración de cierre
4. Verifica la respuesta de `/api/settings`:
   ```json
   {
     "success": true,
     "data": {
       "ordersClosed": true,  // ← Debería ser true
       "closedMessage": "...",
       "closedUntilDate": "2025-12-01T..."
     }
   }
   ```
5. Si `ordersClosed` es `false` en la respuesta, el problema está en el backend
6. Si `ordersClosed` es `true` pero los pedidos siguen permitidos, el problema está en el frontend

### Logs del Backend
Con el nuevo código, cuando guardes settings verás en los logs de Render:
```
Settings guardados: {
  ordersClosed: true,
  closedMessage: '...',
  closedUntilDate: 2025-12-01T...
}
```

Si no ves esto en los logs, Render no está usando el código actualizado.

---

## Redeployar Manualmente en Render

Si Render no detecta los cambios automáticamente:

1. Ve a tu servicio en Render
2. Click en **"Manual Deploy"** → **"Deploy latest commit"**
3. Espera 2-5 minutos a que termine el build
4. Verifica que el status sea **"Live"**

---

## ¿Render Está Desplegando la Rama Correcta?

Verifica que Render esté configurado para desplegar desde `main`:

1. Ve a **"Settings"** en tu servicio de Render
2. Busca la sección **"Build & Deploy"**
3. Verifica que **"Branch"** sea `main` (o la rama que contiene todos los cambios)
4. Si está en otra rama, cámbiala a `main` y guarda
5. Render automáticamente hará un nuevo deploy

---

## Contacto
Si después de seguir estos pasos sigues teniendo problemas, revisa los logs de Render para más detalles sobre el error.
