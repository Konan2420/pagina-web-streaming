# Supabase propio de CMD Streaming

Este repositorio usa un proyecto Supabase propio y se administra desde VS Code y el Dashboard de Supabase. No coloques claves en el código fuente ni uses la clave de servidor en el navegador.

## 1. Variables locales

1. Crea un proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. En **Project Settings > API** copia la URL del proyecto, la **Publishable key** y la clave de servidor (**Secret key** o **service_role**, según la versión de tu proyecto).
3. Copia `.env.example` como `.env.local` y completa exactamente estas variables:

   ```dotenv
   VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY
   VITE_APP_URL=http://127.0.0.1:3001

   SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
   SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY
   SUPABASE_SERVICE_ROLE_KEY=TU_SECRET_KEY_O_SERVICE_ROLE
   ```

`VITE_*` llega al navegador. `SUPABASE_SERVICE_ROLE_KEY` es privada: úsala únicamente en Server Functions, despliegue y `.env.local`. Nunca la antepongas con `VITE_`, nunca la pegues en la consola del navegador y nunca la subas a Git.

## 2. URLs de autenticación

En **Authentication > URL Configuration** configura:

- **Site URL**: la URL pública final, por ejemplo `https://cmdstreaming.pe`.
- **Redirect URLs**:
  - `http://127.0.0.1:3001/tienda`
  - `http://localhost:3001/tienda`
  - `https://TU-DOMINIO/tienda`

Estas rutas son necesarias para confirmación de correo, recuperación de contraseña y OAuth.

### Habilitar Google OAuth

El botón de Google solo funciona después de habilitar el proveedor. Si aparece `Unsupported provider: provider is not enabled`, sigue estos pasos:

1. En [Google Cloud](https://console.cloud.google.com/), crea o selecciona un proyecto, configura la pantalla de consentimiento OAuth y crea un cliente OAuth de tipo **Web application**.
2. En **Authorized JavaScript origins**, agrega:
   - `http://127.0.0.1:3001`
   - `http://localhost:3001`
   - `https://TU-DOMINIO`
3. En **Authorized redirect URIs**, agrega la URL de devolución de tu proyecto Supabase:

```text
https://jxxamracsyapozcepcgb.supabase.co/auth/v1/callback
```

4. Copia el **Client ID** y el **Client secret** de Google.
5. En **Supabase Dashboard > Authentication > Providers > Google**, activa **Enable Sign in with Google**, pega el Client ID y Client secret, y guarda los cambios.

No coloques el Client secret de Google en `.env.local` del navegador ni en el código de la aplicación; queda guardado únicamente en Supabase Dashboard.

## 3. Aplicar y verificar la base de datos

Desde la raíz del repositorio ejecuta:

```powershell
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

El comando `--dry-run` debe indicar que las migraciones son válidas antes de aplicar cambios. Después de cada migración, regenera los tipos que consume la aplicación:

```powershell
npx supabase gen types typescript --project-id TU_PROJECT_REF --schema public > src/integrations/supabase/types.ts
```

## 4. Primer administrador

Crea primero la cuenta desde la landing y confirma su correo. Luego abre **SQL Editor** en el Dashboard y ejecuta este bloque, sustituyendo el correo. No ejecutes este SQL desde el cliente ni desde una cuenta que no controles.

```sql
do $$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where lower(email) = lower('TU_CORREO_ADMINISTRADOR');

  if target_user_id is null then
    raise exception 'No existe una cuenta con ese correo';
  end if;

  delete from public.user_roles where user_id = target_user_id;
  insert into public.user_roles (user_id, role)
  values (target_user_id, 'admin'::public.app_role);
end $$;
```

Cierra sesión y vuelve a iniciarla. Las cuentas nuevas reciben `user`; desde `/admin/usuarios` un administrador puede asignar exclusivamente `user`, `proveedor` o `admin`. Al promover un proveedor, la aplicación crea su perfil de proveedor.

## 5. Diagnóstico remoto

```powershell
npx supabase projects list
npx supabase migration list
npx supabase db push --dry-run
```

`npx supabase status` solo revisa contenedores Supabase locales; no sirve para confirmar el estado de este proyecto remoto. Si el CLI indica falta de privilegios, ejecuta `npx supabase logout`, vuelve a iniciar sesión con la cuenta propietaria del proyecto y comprueba que `TU_PROJECT_REF` corresponde al proyecto correcto.

No subas `.env.local` ni claves privadas al repositorio.
