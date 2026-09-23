import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import styles from "./DiscountBanner.module.css";

export const DISCOUNT_BANNER_CONFIG_ID = "00000000-0000-0000-0000-000000000001";

export type DiscountBannerConfig = Tables<"discount_banner_config">;

type DiscountBannerProps = {
  userId?: string;
  configOverride?: Partial<DiscountBannerConfig> | null;
  userNameOverride?: string;
};

function replacePlaceholders(value: string, user: string, amount: number) {
  return value.replaceAll("{user}", user).replaceAll("{amount}", String(amount));
}

function renderMainText(value: string, amount: number): ReactNode {
  const pieces = value.split(String(amount));
  return pieces.flatMap((piece, index) =>
    index === pieces.length - 1
      ? [piece]
      : [
          piece,
          <span className={styles.highlight} key={`discount-amount-${index}`}>
            {amount}
          </span>,
        ],
  );
}

function formatTimeRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const clock = [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  return days > 0 ? String(days) + "d " + clock : clock;
}

export function DiscountBanner({ userId, configOverride, userNameOverride }: DiscountBannerProps) {
  const [now, setNow] = useState(() => Date.now());
  const configQuery = useQuery({
    queryKey: ["discount-banner-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_banner_config")
        .select("*")
        .eq("id", DISCOUNT_BANNER_CONFIG_ID)
        .maybeSingle();
      if (error) throw error;
      return data as DiscountBannerConfig | null;
    },
    enabled: !configOverride,
  });

  const profileQuery = useQuery({
    queryKey: ["discount-banner-user", userId],
    queryFn: async () => {
      const [profileResult, authResult] = await Promise.all([
        userId
          ? supabase
              .from("profiles")
              .select("nombre_completo, email")
              .eq("id", userId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.auth.getUser(),
      ]);
      if (profileResult.error) throw profileResult.error;
      return {
        name:
          profileResult.data?.nombre_completo?.trim() ||
          authResult.data.user?.user_metadata?.full_name ||
          authResult.data.user?.email?.split("@")[0] ||
          "Cliente",
      };
    },
    enabled: Boolean(userId) && !userNameOverride,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const config = configOverride ?? configQuery.data;
  const startsAt = config?.starts_at ? new Date(config.starts_at).getTime() : 0;
  const endsAt = config?.ends_at ? new Date(config.ends_at).getTime() : null;
  const isLive =
    Boolean(config?.is_active) &&
    startsAt <= now &&
    (endsAt === null || (Number.isFinite(endsAt) && endsAt > now));
  const isPreview = Boolean(configOverride || userNameOverride);
  if (!config || !isLive || (!isPreview && !userId)) return null;

  const userName = userNameOverride ?? profileQuery.data?.name ?? "Cliente";
  const discountAmount = config.discount_amount ?? 0;
  const mainText = replacePlaceholders(config.main_text ?? "", userName, discountAmount);
  const subText = replacePlaceholders(config.sub_text ?? "", userName, discountAmount);
  const icon =
    config.icon_type === "image" && config.icon_value ? (
      <img src={config.icon_value} alt="" />
    ) : (
      config.icon_value || "🎁"
    );
  const timeRemaining =
    endsAt && Number.isFinite(endsAt) ? formatTimeRemaining(endsAt - now) : null;

  return (
    <section
      className={styles.alertBox}
      aria-label="Bonificación de recarga disponible"
      role="status"
    >
      <div className={styles.alertImg}>{icon}</div>
      <div className="min-w-0">
        <p className={styles.alertMain}>{renderMainText(mainText, discountAmount)}</p>
        {subText && <p className={styles.alertSub}>{subText}</p>}
        {timeRemaining && <p className={styles.timer}>Finaliza en {timeRemaining}</p>}
      </div>
    </section>
  );
}
