# send-push-notification

Esta Edge Function recibe el `INSERT` de `admin_event_log`, lee los tokens Expo
de administradores activos y envía una notificación push real.

La función requiere el secreto `ADMIN_PUSH_WEBHOOK_SECRET` y no acepta llamadas
de usuarios finales. La migración `20260827171000` genera ese secreto una vez en
Supabase Vault y lo sincroniza con el entorno de la Edge Function; nunca queda en
la app Expo, en Git ni en una migración legible.

El trigger `admin_event_log_dispatch_push` usa `pg_net` para enviar el `POST`
asíncrono de manera automática. No hace falta crear un Database Webhook manual
desde el panel de Supabase. Si la entrega de una notificación falla, se registra
una advertencia sin bloquear una compra, recarga o actualización de inventario.

Supabase envía un payload con `record.id`; la Edge Function vuelve a leer ese
evento en la base de datos y no confía en el texto enviado por el webhook.
