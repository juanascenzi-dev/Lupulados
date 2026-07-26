# Setup del primer ADMIN

No hay usuarios ADMIN en el seed y no se guardan contraseñas en Git.

## Variables públicas

Configurar en el entorno del frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

`VITE_SUPABASE_ANON_KEY` se admite temporalmente por compatibilidad, pero se prefiere `VITE_SUPABASE_PUBLISHABLE_KEY`.

No usar variables `VITE_` para service role, secretos, tokens o contraseñas.

## Crear el usuario

1. Crear el usuario desde Supabase Auth.
2. Confirmar email si el proyecto lo requiere.
3. Copiar el UUID real del usuario.
4. Insertar el UUID en `public.admin_users` con una sesión administrativa controlada.

SQL de ejemplo:

```sql
insert into public.admin_users (user_id, active, created_by)
values ('<ADMIN_USER_UUID>', true, null)
on conflict (user_id) do update
set active = true;
```

No reemplazar `<ADMIN_USER_UUID>` por un UUID inventado. Debe ser el UUID real de `auth.users`.

## Login

La ruta administrativa es:

```txt
/admin/login
```

El login usa `signInWithPassword`. La autorización real se valida con `public.is_admin()` y RLS.

## Retirar un ADMIN

Usar una sesión administrativa controlada:

```sql
update public.admin_users
set active = false
where user_id = '<ADMIN_USER_UUID>';
```

No borrar el usuario si se quiere conservar trazabilidad histórica.
