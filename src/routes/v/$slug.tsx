import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, PackageOpen, Store } from "lucide-react";
import { getPublicSellerStore } from "@/lib/seller.functions";
import { Button } from "@/components/ui/button";

type PublicStore = {
  display_name: string;
  slug: string;
  banner_url: string | null;
  items: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    image_url: string | null;
    price_sale: number;
    promo_price: number | null;
    stock: number;
  }>;
};

export const Route = createFileRoute("/v/$slug")({
  ssr: false,
  component: PublicSellerStore,
});

function PublicSellerStore() {
  const { slug } = Route.useParams();
  const { data, isLoading, error } = useQuery<PublicStore | null>({
    queryKey: ["public-seller-store", slug],
    queryFn: () => getPublicSellerStore({ data: { slug } }),
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background p-8"><div className="mx-auto h-72 max-w-6xl animate-pulse rounded-2xl border border-border bg-white/[0.03]" /></div>;
  }
  if (error || !data) {
    return <div className="grid min-h-screen place-items-center bg-background p-6 text-center text-white"><div><Store className="mx-auto mb-4 h-10 w-10 text-white/30" /><h1 className="text-xl font-bold">Esta tienda no está disponible</h1><p className="mt-2 text-sm text-white/50">Puede que el enlace sea incorrecto o que la tienda esté inactiva.</p><Button asChild variant="outline" className="mt-5"><Link to="/tienda"><ArrowLeft /> Volver al catálogo</Link></Button></div></div>;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link to="/tienda" className="inline-flex items-center gap-2 text-xs font-medium text-white/55 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Catálogo general</Link>
        <header className="mt-5 overflow-hidden rounded-2xl border border-border bg-white/[0.025]">
          {data.banner_url && <img src={data.banner_url} alt="" className="h-40 w-full object-cover opacity-75" />}
          <div className="flex items-center gap-4 p-6"><div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary"><Store className="h-6 w-6" /></div><div><h1 className="text-2xl font-black text-white">{data.display_name}</h1><p className="mt-1 text-sm text-white/55">Productos y servicios digitales disponibles.</p></div></div>
        </header>

        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-white">Productos disponibles</h2><span className="text-xs text-white/45">{data.items.length} publicaciones</span></div>
          {data.items.length === 0 ? (
            <div className="rounded-xl border border-border p-10 text-center text-sm text-white/45"><PackageOpen className="mx-auto mb-3 h-8 w-8" />Esta tienda aún no tiene productos publicados.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-border bg-white/[0.025] transition hover:-translate-y-0.5 hover:border-primary/40"><div className="grid aspect-[16/9] place-items-center bg-white/[0.035]">{item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : <PackageOpen className="h-8 w-8 text-white/30" />}</div><div className="p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{item.category}</p><h3 className="mt-1 font-bold text-white">{item.name}</h3><p className="mt-1 line-clamp-2 min-h-10 text-xs text-white/50">{item.description || "Producto digital con entrega según disponibilidad."}</p><div className="mt-4 flex items-end justify-between"><span className={item.stock > 0 ? "text-xs text-emerald-300" : "text-xs text-red-300"}>{item.stock > 0 ? `${item.stock} disponibles` : "Sin stock"}</span><div className="text-right">{item.promo_price !== null && <p className="text-[10px] text-white/35 line-through">S/ {item.price_sale.toFixed(2)}</p>}<p className="font-bold text-white">S/ {(item.promo_price ?? item.price_sale).toFixed(2)}</p></div></div></div></article>)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
