import { Check, Eye, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { AVATAR_EFFECTS, normalizeEffect } from "@/lib/avatar-effects";
import { AvatarEffect } from "@/components/supplier/AvatarEffect";

type Props = {
  currentEffect: string;
  previewEffect: string;
  avatarUrl: string;
  saving: boolean;
  onPreview: (id: string) => void;
  onApply: (id: string) => void | Promise<void>;
};

/** Galería de efectos animados para el avatar del proveedor. */
export function AvatarEffectPicker({
  currentEffect,
  previewEffect,
  avatarUrl,
  saving,
  onPreview,
  onApply,
}: Props) {
  const [big, setBig] = useState(false);
  const selected = normalizeEffect(previewEffect);
  const dirty = selected !== normalizeEffect(currentEffect);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg text-foreground uppercase tracking-tight">
          Efecto del Avatar
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Personaliza tu perfil con un efecto animado único.
        </p>
      </div>

      {big && (
        <div className="flex justify-center py-4">
          <AvatarEffect effect={selected} size="lg">
            <div className="w-40 h-40 rounded-full overflow-hidden border border-white/10 bg-white/5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Vista previa del efecto"
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
          </AvatarEffect>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {AVATAR_EFFECTS.map((fx) => {
          const active = selected === fx.id;
          return (
            <button
              key={fx.id}
              type="button"
              onClick={() => onPreview(fx.id)}
              aria-pressed={active}
              title={fx.desc}
              className={`relative flex flex-col items-center gap-2.5 p-3 rounded-2xl border transition ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-white/10 bg-white/[0.03] hover:border-primary/40"
              }`}
            >
              <AvatarEffect effect={fx.id} size="sm">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-white/10">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
              </AvatarEffect>
              <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight text-muted-foreground">
                {fx.label}
              </span>
              {active && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground grid place-items-center">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => onApply(selected)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest disabled:opacity-40 hover:brightness-110 transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Aplicar efecto
        </button>
        <button
          type="button"
          onClick={() => setBig((v) => !v)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground text-[11px] font-black uppercase tracking-widest hover:border-primary/50 transition"
        >
          <Eye className="w-4 h-4" /> Vista previa
        </button>
        <button
          type="button"
          onClick={() => onPreview("none")}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground text-[11px] font-black uppercase tracking-widest hover:border-primary/50 transition"
        >
          <X className="w-4 h-4" /> Quitar efecto
        </button>
      </div>
    </div>
  );
}
