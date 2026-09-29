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
npx.cmd supabase functions deploy send-telegram-notification --no-verify-jwt
```

La función registra trazas seguras en los logs de Edge Functions con los eventos
`request_received`, `event_received`, `configuration_checked`,
`telegram_response` y `delivery_failed`. Nunca registra el token, el chat ID ni
el cuerpo completo del mensaje.

Si Telegram devuelve `400 Bad Request: chat not found`, el flujo de Supabase sí
está funcionando y `TELEGRAM_CHAT_ID` no apunta a un chat accesible para el bot.
En un chat privado, abre el bot y pulsa **Start**. En un grupo, agrega el bot,
otórgale permiso para enviar mensajes y configura el ID numérico del grupo
(normalmente empieza por `-100`). Después actualiza el secret remoto y repite
una recarga de prueba.

El token del bot, el identificador del chat y el secreto compartido nunca se
incluyen en `.env`, en el frontend ni en las migraciones.
