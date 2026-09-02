import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CalendarClock, Phone, Smartphone } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getUpcomingExpirations } from "@/lib/admin.functions";
import { buildExpiryReminderWhatsAppMessage, formatWhatsAppDate } from "@/lib/whatsapp-messages";
import { createWhatsAppUrl, openWhatsAppUrl } from "@/lib/whatsapp";
import { toast } from "sonner";

const upcomingExpirationsQuery = queryOptions({
  queryKey: ["admin-upcoming-expirations"],
  queryFn: () => getUpcomingExpirations(),
});

export const Route = createFileRoute("/_authenticated/admin/vencimientos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(upcomingExpirationsQuery),
  component: UpcomingExpirations,
});

function UpcomingExpirations() {
  const { data: expirations } = useSuspenseQuery(upcomingExpirationsQuery);

  function getReminderUrl(expiration: (typeof expirations)[number]) {
    return createWhatsAppUrl(
      expiration.whatsapp,
      buildExpiryReminderWhatsAppMessage({
        customerName: expiration.customerName,
        productName: expiration.productName,
        expirationDate: expiration.expirationDate,
      }),
    );
  }

  function sendReminder(expiration: (typeof expirations)[number]) {
    const url = getReminderUrl(expiration);
    if (!url) {
      toast.error("Sin número de WhatsApp registrado");
      return;
    }
    if (!openWhatsAppUrl(url)) {
      toast.info("Permite las ventanas emergentes para abrir WhatsApp.");
    }
  }

  return (
    <AdminLayout
      title="Vencimientos próximos"
      subtitle="Pedidos que vencen hoy o durante los próximos siete días. WhatsApp se abre listo para enviar manualmente."
    >
      <div className="grid gap-4">
        {expirations.length === 0 ? (
          <section className="rounded-2xl border border-white/5 bg-white/[0.025] px-5 py-16 text-center text-sm text-white/40">
            No hay vencimientos durante los próximos siete días.
          </section>
        ) : (
          expirations.map((expiration) => {
            const whatsAppUrl = getReminderUrl(expiration);
            return (
              <article
                key={`${expiration.source}-${expiration.id}`}
                className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-amber-200">
                    <CalendarClock className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      Vence el {formatWhatsAppDate(expiration.expirationDate)}
                    </span>
                  </div>
                  <h2 className="mt-2 truncate text-base font-bold text-white">
                    {expiration.productName}
                  </h2>
                  <p className="mt-1 text-sm text-white/55">
                    {expiration.customerName || "Cliente sin nombre"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-white/35">
                    <Phone className="h-3.5 w-3.5" />
                    {expiration.whatsapp || "Sin número de WhatsApp registrado"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => sendReminder(expiration)}
                  disabled={!whatsAppUrl}
                  title={
                    whatsAppUrl
                      ? "Abrir WhatsApp con el recordatorio pre-escrito"
                      : "Sin número de WhatsApp registrado"
                  }
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-green-400/25 bg-green-400/10 px-4 py-2.5 text-xs font-black text-green-100 transition hover:bg-green-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/35"
                >
                  <Smartphone className="h-4 w-4" />
                  {whatsAppUrl ? "Enviar recordatorio" : "Sin número de WhatsApp registrado"}
                </button>
              </article>
            );
          })
        )}
      </div>
    </AdminLayout>
  );
}
