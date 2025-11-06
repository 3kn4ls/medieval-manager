#!/bin/bash

# Script para actualizar la URL del backend en el frontend

echo "🔧 Configurador de URL del Backend"
echo "===================================="
echo ""

# Solicitar la URL del backend
read -p "Introduce la URL de tu backend en Render (ej: https://bocadillos-backend.onrender.com): " BACKEND_URL

# Validar que no esté vacía
if [ -z "$BACKEND_URL" ]; then
  echo "❌ Error: La URL no puede estar vacía"
  exit 1
fi

# Remover barra final si existe
BACKEND_URL="${BACKEND_URL%/}"

# Crear el contenido del archivo environment.prod.ts
cat > frontend/src/environments/environment.prod.ts << EOF
export const environment = {
  production: true,
  apiUrl: '${BACKEND_URL}/api',
};
EOF

echo ""
echo "✅ Archivo frontend/src/environments/environment.prod.ts actualizado"
echo ""
echo "📋 Configuración:"
echo "   Backend URL: ${BACKEND_URL}"
echo "   API URL: ${BACKEND_URL}/api"
echo ""
echo "🚀 Ahora puedes continuar con el despliegue en Vercel"
echo ""
echo "📝 Siguiente paso: Hacer commit de este cambio"
echo "   git add frontend/src/environments/environment.prod.ts"
echo "   git commit -m \"Configure production backend URL\""
echo "   git push"
echo ""
