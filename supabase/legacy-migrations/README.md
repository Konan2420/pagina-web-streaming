# Migraciones archivadas sin aplicar

Estos archivos se conservan como historial local, pero no se aplican al proyecto
Supabase enlazado. Incluyen una migración que elimina la estructura y los datos de
proveedores/vendedores, o cambios de catálogo ajenos al despliegue de soporte y
recargas.

Se archivaron el 23 de agosto de 2026 después de verificar que la base remota
mantiene `supplier_profiles` y referencias de proveedor activas.

No muevas estos archivos de nuevo a `supabase/migrations` sin revisar el impacto
en producción y preparar una copia de seguridad.
