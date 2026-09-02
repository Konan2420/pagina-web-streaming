import { Eye, Facebook, Instagram, Moon, Search, Sun, Youtube } from "lucide-react";
import { FaTiktok, FaXTwitter } from "react-icons/fa6";
import { getStorefrontTemplate } from "@/components/storefront/storefront-templates";

export type StorefrontPreviewSettings = {
  displayName: string;
  storeSlug: string;
  bannerUrl: string;
  logoUrl: string;
  templateKey: string;
  avatarFrameKey: "neon" | "fire" | "gold" | null;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  xUrl: string;
  youtubeUrl: string;
};

type PreviewProduct = { id: string; name: string; price: number | null; imageUrl?: string | null };

function money(value: number | null) {
  if (value === null) return "S/ —";
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "CMD";
}

const frameClass: Record<NonNullable<StorefrontPreviewSettings["avatarFrameKey"]>, string> = {
  neon: "ring-4 ring-cyan-300 shadow-[0_0_22px_rgba(34,211,238,.9)]",
  fire: "ring-4 ring-orange-400 shadow-[0_0_22px_rgba(249,115,22,.9)]",
  gold: "ring-4 ring-amber-300 shadow-[0_0_22px_rgba(251,191,36,.9)]",
};

export function StorefrontLivePreview({
  settings,
  products,
  totalSales,
  publicHref,
}: {
  settings: StorefrontPreviewSettings;
  products: PreviewProduct[];
  totalSales: number;
  publicHref: string;
}) {
  const template = getStorefrontTemplate(settings.templateKey);
  const socialLinks = [
    { href: settings.facebookUrl, label: "Facebook", icon: Facebook },
    { href: settings.instagramUrl, label: "Instagram", icon: Instagram },
    { href: settings.tiktokUrl, label: "TikTok", icon: FaTiktok },
    { href: settings.xUrl, label: "X", icon: FaXTwitter },
    { href: settings.youtubeUrl, label: "YouTube", icon: Youtube },
  ].filter((link) => Boolean(link.href));

  return (
    <aside className="xl:sticky xl:top-4 xl:self-start">
      <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-display text-base font-bold text-white">Visualizador en vivo</h3><a href={publicHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/65 transition hover:text-white"><Eye className="h-3.5 w-3.5" /> Ver tienda pública</a></div>
      <div className="overflow-hidden rounded-[1.25rem] border border-white/10 shadow-2xl shadow-black/30" style={{ backgroundColor: template.surface, color: template.text }}>
        <div className="relative h-28 overflow-hidden sm:h-36" style={{ background: `linear-gradient(135deg, ${template.surface}, ${template.accent}66)` }}>
          {settings.bannerUrl && <img src={settings.bannerUrl} alt="Vista previa de portada" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
        </div>
        <div className="relative px-4 pb-4 pt-0">
          <div className={`-mt-9 grid h-[4.5rem] w-[4.5rem] place-items-center overflow-hidden rounded-full border-4 border-black/35 bg-card text-sm font-black text-white ${settings.avatarFrameKey ? frameClass[settings.avatarFrameKey] : ""}`}>
            {settings.logoUrl ? <img src={settings.logoUrl} alt="Avatar" className="h-full w-full object-cover" /> : initials(settings.displayName)}
          </div>
          <div className="mt-2 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-product text-lg font-bold">@{settings.storeSlug || "mi-tienda"}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: template.accentSoft }}>{totalSales} ventas</p></div><span className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-black/15 text-white/75"><Moon className="h-3.5 w-3.5" /><Sun className="sr-only" /></span></div>
          {socialLinks.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{socialLinks.map(({ href, label, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-black/15 text-white/75 transition hover:text-white"><Icon className="h-3.5 w-3.5" /></a>)}</div>}
          <label className="relative mt-4 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" /><input readOnly placeholder="Buscar cuentas, juegos..." className="h-9 w-full rounded-md border border-white/10 bg-black/15 pl-9 pr-3 text-[11px] text-white outline-none placeholder:text-white/35" /></label>
          <div className="mt-3 grid grid-cols-2 gap-2">{products.slice(0, 4).map((product) => <article key={product.id} className="min-h-24 overflow-hidden rounded-md border border-white/10 bg-black/15 p-2.5"><div className="h-8 rounded bg-white/[0.05]" style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined} /><p className="mt-2 line-clamp-1 text-[10px] font-bold text-white">{product.name}</p><p className="mt-0.5 text-[10px] font-bold" style={{ color: template.accentSoft }}>{money(product.price)}</p></article>)}</div>
          {products.length === 0 && <div className="mt-3 rounded-md border border-dashed border-white/15 p-5 text-center text-[10px] text-white/45">Publica productos para verlos aquí.</div>}
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-white/40">*Esta es una previsualización aproximada. La tienda pública reflejará los colores exactos de la plantilla publicada.</p>
    </aside>
  );
}
