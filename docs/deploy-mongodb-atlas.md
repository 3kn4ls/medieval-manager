# 📦 Despliegue de MongoDB Atlas

MongoDB Atlas ofrece un cluster gratuito de 512MB, ideal para este proyecto.

## 🚀 Pasos para crear tu base de datos

### 1. Crear cuenta en MongoDB Atlas

1. Ve a https://www.mongodb.com/cloud/atlas/register
2. Regístrate con tu email o cuenta de Google/GitHub
3. Completa el formulario de registro

### 2. Crear un Cluster Gratuito

1. Selecciona el plan **FREE** (M0 Sandbox)
2. Elige el proveedor cloud más cercano (AWS, Google Cloud o Azure)
3. Selecciona la región más cercana a ti (ej: Europe - Ireland)
4. Dale un nombre a tu cluster (ej: `bocadillos-cluster`)
5. Click en **Create Cluster**

### 3. Configurar acceso a la base de datos

#### 3.1 Crear usuario de base de datos

1. Ve a **Database Access** en el menú lateral
2. Click en **Add New Database User**
3. Elige **Password** como método de autenticación
4. Crea un usuario (ej: `bocadillos-app`)
5. Genera una contraseña segura (guárdala, la necesitarás)
6. En **Database User Privileges**, selecciona **Read and write to any database**
7. Click en **Add User**

#### 3.2 Configurar IP de acceso

1. Ve a **Network Access** en el menú lateral
2. Click en **Add IP Address**
3. Click en **Allow Access From Anywhere** (0.0.0.0/0)
   - **Nota:** Para producción, es mejor limitar las IPs específicas de tu servidor
4. Click en **Confirm**

### 4. Obtener la URL de conexión

1. Ve a **Database** en el menú lateral
2. Click en **Connect** en tu cluster
3. Selecciona **Connect your application**
4. Elige **Driver: Node.js** y **Version: 5.5 or later**
5. Copia la connection string, será algo como:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Reemplaza:
   - `<username>` con tu usuario (ej: `bocadillos-app`)
   - `<password>` con la contraseña que creaste
   - Añade el nombre de la base de datos después del `/`, ejemplo:
   ```
   mongodb+srv://bocadillos-app:tupassword@cluster0.xxxxx.mongodb.net/bocadillos?retryWrites=true&w=majority
   ```

### 5. Configurar en tu aplicación

#### Para desarrollo local (backend/.env):
```env
MONGODB_URI=mongodb+srv://bocadillos-app:tupassword@cluster0.xxxxx.mongodb.net/bocadillos?retryWrites=true&w=majority
```

#### Para Render:
Añade esta URL como variable de entorno `MONGODB_URI` en la configuración de tu servicio.

## ✅ Verificar conexión

Una vez configurado, inicia tu backend y verifica en los logs:

```
✅ MongoDB conectado correctamente
```

## 📊 Monitoreo

En MongoDB Atlas puedes:
- Ver métricas de uso en tiempo real
- Explorar colecciones y documentos
- Ver logs de conexiones
- Configurar alertas

## 🔒 Seguridad

**Importante:**
- ❌ NUNCA subas tu connection string a GitHub
- ✅ Usa siempre variables de entorno
- ✅ En producción, limita las IPs de acceso
- ✅ Usa contraseñas fuertes para los usuarios de BD

## 💡 Límites del plan gratuito

- **Almacenamiento:** 512 MB
- **Conexiones:** 500 conexiones concurrentes
- **Copias de seguridad:** No incluidas
- **Cluster compartido:** Rendimiento compartido

Para este proyecto de bocadillos es más que suficiente.

## 🆘 Problemas comunes

### Error de autenticación
- Verifica que el usuario y contraseña sean correctos
- Asegúrate de URL-encodear caracteres especiales en la contraseña

### Error de conexión de red
- Verifica que 0.0.0.0/0 esté en Network Access
- Espera 1-2 minutos después de añadir la IP

### Cluster no disponible
- Los clusters gratuitos pueden suspenderse tras inactividad
- Se reactivan automáticamente al intentar conectar
