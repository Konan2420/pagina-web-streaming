# Desarrollo y publicación desde VS Code

## Desarrollo local

1. Instala dependencias: npm install.
2. Copia .env.example a .env.local y completa Supabase.
3. Ejecuta: npm run dev.
4. Abre: http://127.0.0.1:3001.

## Base de datos

- Gestiona el esquema con los archivos de supabase/migrations.
- Consulta supabase/README.md para enlazar tu proyecto y aplicar las migraciones.
- Conserva SUPABASE_SERVICE_ROLE_KEY solamente en el servidor o en los secretos del proveedor de hosting.

## Publicación

El proyecto compila un servidor Node con TanStack Start y Nitro.

1. Define en el hosting las variables de .env.example.
2. Ejecuta npm run build.
3. Inicia la aplicación con npm run start.

Puedes desplegar la salida .output en cualquier proveedor compatible con Node.js, por ejemplo Railway, Render, Fly.io, un VPS o Docker. Configura la URL pública en VITE_APP_URL y en los redirects de Supabase Auth.
