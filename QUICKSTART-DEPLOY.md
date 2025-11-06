# ⚡ Inicio Rápido - Despliegue en Producción

Guía ultra-rápida para desplegar en 3 pasos.

---

## 🎯 Resumen

1. **MongoDB Atlas** → Base de datos (10 min)
2. **Render** → Backend (15 min)
3. **Vercel** → Frontend (10 min)

**Total: ~35 minutos** ⏱️

---

## PASO 1️⃣: MongoDB Atlas

### Acciones rápidas:
1. 🌐 Ir a: https://www.mongodb.com/cloud/atlas/register
2. Registrarse con Google o email
3. Crear cluster **M0 FREE**
4. Crear usuario de BD y guardar contraseña
5. Permitir acceso desde `0.0.0.0/0`
6. Copiar connection string y modificarlo:
   ```
   mongodb+srv://usuario:PASSWORD@cluster0.xxxxx.mongodb.net/bocadillos?retryWrites=true&w=majority
   ```

### ✅ Output necesario:
```
MONGODB_URI=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/bocadillos?...
```

**📋 Guarda esto, lo necesitarás en Render**

---

## PASO 2️⃣: Render (Backend)

### Acciones rápidas:
1. 🌐 Ir a: https://render.com
2. Sign up con GitHub
3. **New +** → **Web Service**
4. Conectar repositorio `medieval-manager`
5. Configurar:
   ```
   Name: bocadillos-backend
   Region: Frankfurt
   Branch: claude/angular-sandwich-order-app-011CUsEPZrCuK3y9nqJrvmoS
   Root Directory: backend
   Runtime: Node
   Build: npm install && npm run build
   Start: npm start
   Plan: Free
   ```
6. Variables de entorno:
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=[tu connection string de Atlas]
   FRONTEND_URL=https://provisional.com
   ```
7. Click en **Create Web Service**
8. Esperar 2-5 minutos

### ✅ Output necesario:
```
Backend URL: https://bocadillos-backend.onrender.com
```

### Verificar:
```
https://TU-BACKEND.onrender.com/health
→ Deberías ver: {"status":"ok",...}
```

**📋 Guarda la URL, la necesitarás para Vercel**

---

## PASO 3️⃣: Vercel (Frontend)

### 3.1 Configurar URL del backend

Desde la raíz del proyecto:

```bash
# Ejecutar script interactivo
./update-backend-url.sh

# Cuando te pida la URL, introduce:
https://TU-BACKEND.onrender.com

# Commit y push
git add frontend/src/environments/environment.prod.ts
git commit -m "Configure production backend URL"
git push
```

### 3.2 Desplegar en Vercel

1. 🌐 Ir a: https://vercel.com/signup
2. Sign up con GitHub
3. **Add New...** → **Project**
4. Importar `medieval-manager`
5. Configurar:
   ```
   Framework: Angular (autodetectado)
   Root Directory: frontend
   Build Command: npm install && npm run build
   Output Directory: dist/bocadillos-frontend/browser
   ```
6. Click en **Deploy**
7. Esperar 2-3 minutos

### ✅ Output:
```
Frontend URL: https://medieval-manager.vercel.app
```

---

## PASO 4️⃣: Actualizar CORS en Render

**MUY IMPORTANTE** - El último paso:

1. Vuelve a Render
2. Ve a tu servicio `bocadillos-backend`
3. Ve a **Environment**
4. Edita `FRONTEND_URL`
5. Cambia a tu URL de Vercel: `https://TU-APP.vercel.app`
6. **Save Changes**
7. El servicio se reiniciará (~1 min)

---

## ✅ Verificación Final

### 1. Probar Backend
```
https://TU-BACKEND.onrender.com/health
→ {"status":"ok"}
```

### 2. Probar Frontend
```
https://TU-FRONTEND.vercel.app
→ Deberías ver la aplicación
```

### 3. Probar Integración
- Abre el frontend
- Verifica que se muestre el estado de la ventana de pedidos
- Si es lunes-jueves antes de 17:00, intenta crear un pedido

---

## 🚨 Problemas Comunes

### Backend tarda mucho en responder
- Normal en plan gratuito de Render (se duerme tras inactividad)
- Primera petición tarda ~30 segundos
- Siguientes peticiones son inmediatas

### Error de CORS en el frontend
- Verifica que `FRONTEND_URL` en Render sea exactamente tu URL de Vercel
- Debe incluir `https://` y NO terminar en `/`

### Frontend no conecta al backend
- Verifica que `environment.prod.ts` tenga la URL correcta
- Debe terminar en `/api` (sin barra final)

### MongoDB connection error
- Verifica que `0.0.0.0/0` esté en Network Access en Atlas
- Verifica que usuario y contraseña sean correctos
- Caracteres especiales en password deben estar URL-encoded

---

## 📊 Checklist Final

- [ ] MongoDB Atlas funcionando
- [ ] Render backend desplegado y responde en `/health`
- [ ] Frontend desplegado en Vercel
- [ ] `FRONTEND_URL` actualizada en Render
- [ ] Frontend se abre sin errores
- [ ] Frontend muestra estado de ventana de pedidos
- [ ] Puedes crear un pedido (si es lunes-jueves <17:00)

---

## 🎉 ¡Todo Listo!

Tu aplicación está 100% funcional en producción:
- ✅ Frontend en Vercel (gratis, ilimitado)
- ✅ Backend en Render (gratis, 750h/mes)
- ✅ Base de datos en MongoDB Atlas (gratis, 512MB)

**Comparte la URL de Vercel con tu equipo y a disfrutar de los bocadillos! 🥖**

---

## 🔗 URLs de tus servicios

Anota aquí tus URLs para referencia futura:

```
MongoDB Atlas:
Connection String: [tu string aquí]

Render (Backend):
URL: https://_____________________.onrender.com
Dashboard: https://dashboard.render.com

Vercel (Frontend):
URL: https://_____________________.vercel.app
Dashboard: https://vercel.com/dashboard
```

---

## 📞 Soporte

Si algo no funciona:
1. Revisa la guía detallada: `docs/DEPLOYMENT-GUIDE.md`
2. Revisa logs en Render dashboard
3. Revisa build logs en Vercel
4. Verifica todas las URLs y variables de entorno
