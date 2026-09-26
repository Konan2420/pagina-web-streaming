# Notificaciones administrativas por Telegram

Esta Edge Function recibe únicamente eventos internos de `pg_net`. No debe
invocarse desde el navegador.

Configura en **Supabase Dashboard → Edge Functions → Secrets**:

- `TELEGRAM_BOT_TOKEN`: token del bot creado en BotFather.
- `TELEGRAM_CHAT_ID`: chat privado o grupo donde recibirá los avisos.
- `ADMIN_PUSH_WEBHOOK_SECRET`: ya existente en el proyecto y compartido con la
  función de notificaciones móviles. La migración lo lee desde Vault, por lo
  que no hay que copiarlo al repositorio. En entornos aislados puedes usar
  `ADMIN_TELEGRAM_WEBHOOK_SECRET` en su lugar.

Después de configurar los tres secretos, despliega la función:

```bash
supabase functions deploy send-telegram-notification --no-verify-jwt
```

El token del bot, el identificador del chat y el secreto compartido nunca se
incluyen en `.env`, en el frontend ni en las migraciones.
