# 🚀 Guía Paso a Paso - Despliegue Completo en Producción

Guía interactiva para desplegar tu aplicación de bocadillos completamente gratis.

---

## 📋 Checklist Previo

Antes de empezar, asegúrate de tener:
- [ ] Cuenta de email para registrarte en los servicios
- [ ] Cuenta de GitHub (la que usas para este proyecto)
- [ ] Este repositorio pusheado a GitHub
- [ ] 30-40 minutos de tiempo disponible

---

## PASO 1: MongoDB Atlas (Base de Datos) ⏱️ ~10 minutos

### 1.1 Crear cuenta

1. 🌐 Abre: https://www.mongodb.com/cloud/atlas/register
2. Click en **"Sign up with Google"** o usa tu email
3. Completa el formulario si es necesario
4. Verifica tu email si te lo piden

### 1.2 Crear Cluster Gratuito

Después de iniciar sesión:

1. Te preguntará sobre tu objetivo → Selecciona **"Learn MongoDB"**
2. Lenguaje preferido → Selecciona **"JavaScript"**
3. Click en **"Finish"**

Ahora vas a crear el cluster:

4. Click en **"+ Create"** o **"Build a Database"**
5. Selecciona el plan **M0 FREE** (debería estar ya seleccionado)
6. Configuración:
   - **Provider:** AWS (recomendado)
   - **Region:** Elige la más cercana a España (ej: Ireland eu-west-1)
   - **Name:** Deja el nombre por defecto o ponle `bocadillos-cluster`
7. Click en **"Create Deployment"** (botón verde)

### 1.3 Configurar Seguridad

Ahora MongoDB te mostrará un diálogo de seguridad:

**A) Crear usuario de base de datos:**
1. Verás un formulario con username y password
2. **Username:** Usa `bocadillos-admin` (o el que prefieras)
3. **Password:** Click en "Autogenerate Secure Password" → **COPIA ESTA CONTRASEÑA** (la necesitarás)
   - O crea una contraseña fuerte y guárdala
4. Click en **"Create Database User"**

**B) Configurar acceso de red:**
1. En la misma pantalla, abajo verás "Where would you like to connect from?"
2. Click en **"My Local Environment"**
3. Click en **"Add My Current IP Address"**
4. Luego click en **"Add Entry"** o similar
5. Añade también: `0.0.0.0/0` (para permitir Render)
   - Click en "Add IP Address"
   - IP: `0.0.0.0/0`
   - Description: `Allow from anywhere`
   - Click "Add Entry"
6. Click en **"Finish and Close"**

### 1.4 Obtener Connection String

1. Click en **"Go to Databases"** o navega a "Database" en el menú izquierdo
2. Verás tu cluster, click en **"Connect"**
3. Selecciona **"Connect your application"** (opción del medio)
4. Asegúrate de que está seleccionado:
   - **Driver:** Node.js
   - **Version:** 5.5 or later
5. Copia el connection string (algo como):
   ```
   mongodb+srv://bocadillos-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 1.5 Preparar tu Connection String Final

Toma el string que copiaste y:
1. Reemplaza `<password>` con la contraseña que guardaste
2. Añade el nombre de la base de datos `/bocadillos` después del `.net`

**Ejemplo:**
```
ANTES:
mongodb+srv://bocadillos-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

DESPUÉS:
mongodb+srv://bocadillos-admin:MiPassword123@cluster0.xxxxx.mongodb.net/bocadillos?retryWrites=true&w=majority
```

**✅ GUARDA ESTE STRING EN UN LUGAR SEGURO - LO NECESITARÁS EN EL SIGUIENTE PASO**

---

## PASO 2: Render (Backend) ⏱️ ~15 minutos

### 2.1 Crear cuenta en Render

1. 🌐 Abre: https://render.com
2. Click en **"Get Started"** o **"Sign Up"**
3. **Importante:** Click en **"Sign up with GitHub"**
4. Autoriza a Render a acceder a tus repositorios

### 2.2 Crear Web Service

1. En el dashboard, click en **"New +"** (arriba a la derecha)
2. Selecciona **"Web Service"**
3. Conecta tu repositorio:
   - Si no ves tu repo, click en "Configure account" y da permisos
   - Busca `medieval-manager`
   - Click en **"Connect"**

### 2.3 Configurar el servicio

En la página de configuración, completa:

**Información básica:**
- **Name:** `bocadillos-backend` (o el nombre que prefieras, sin espacios)
- **Region:** Elige `Frankfurt (EU Central)` (más cercano a España)
- **Branch:** `claude/angular-sandwich-order-app-011CUsEPZrCuK3y9nqJrvmoS`
- **Root Directory:** `backend` ← **MUY IMPORTANTE**
- **Runtime:** `Node`

**Build & Deploy:**
- **Build Command:**
  ```
  npm install && npm run build
  ```
- **Start Command:**
  ```
  npm start
  ```

**Plan:**
- Selecciona **"Free"** (0$/month)

### 2.4 Variables de Entorno

Baja hasta la sección **"Environment Variables"**

Click en **"Add Environment Variable"** y añade estas 4 variables:

**Variable 1:**
- Key: `NODE_ENV`
- Value: `production`

**Variable 2:**
- Key: `PORT`
- Value: `3000`

**Variable 3:**
- Key: `MONGODB_URI`
- Value: `[PEGA AQUÍ TU CONNECTION STRING DE MONGODB ATLAS]`
  - Ejemplo: `mongodb+srv://bocadillos-admin:MiPassword123@cluster0.xxxxx.mongodb.net/bocadillos?retryWrites=true&w=majority`

**Variable 4:**
- Key: `FRONTEND_URL`
- Value: `https://provisional.com` (lo cambiaremos después cuando tengamos Vercel)

### 2.5 Deploy

1. Revisa que todo esté correcto
2. Click en **"Create Web Service"** (botón azul abajo)
3. Render empezará a construir tu aplicación
4. Verás logs en tiempo real → Espera hasta que veas **"Your service is live 🎉"**
5. Esto puede tardar **2-5 minutos**

### 2.6 Obtener la URL del Backend

1. Una vez desplegado, arriba verás tu URL:
   ```
   https://bocadillos-backend.onrender.com
   ```
   (o el nombre que hayas puesto)

2. **✅ COPIA ESTA URL - LA NECESITARÁS PARA VERCEL**

3. Verifica que funciona:
   - Click en la URL para abrirla
   - Añade `/health` al final
   - Deberías ver: `{"status":"ok","timestamp":"..."}`

**Si ves el JSON → ¡BACKEND FUNCIONANDO! ✅**

---

## PASO 3: Vercel (Frontend) ⏱️ ~10 minutos

### 3.1 Actualizar configuración del frontend

Antes de desplegar, necesitamos configurar la URL de tu backend.

Voy a crear un script para hacerlo fácilmente.

**✋ ESPERA - No hagas este paso todavía, te lo voy a automatizar en el siguiente mensaje**

---

## Resumen de URLs que debes tener listas

Antes de continuar a Vercel, asegúrate de tener:

✅ **MongoDB URI:**
```
mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/bocadillos?...
```

✅ **Backend URL (Render):**
```
https://tu-backend.onrender.com
```

---

¿Has completado los pasos 1 y 2? Una vez tengas MongoDB y Render funcionando, dime:
1. ✅ Si MongoDB está listo
2. ✅ Si Render está desplegado
3. 📋 La URL de tu backend en Render

Y continuaremos con Vercel (el último paso).
