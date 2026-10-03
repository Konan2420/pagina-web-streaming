import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Legacy platform descriptions and prices stay on the server. */
export const getProtectedPlatformPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { platformPages } = await import("@/lib/platform-pages");
    return platformPages;
  });

export const getProtectedPlatformPage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((slug: string) => z.string().min(1).max(80).parse(slug))
  .handler(async ({ data: slug }) => {
    const { getPlatformPage } = await import("@/lib/platform-pages");
    return getPlatformPage(slug);
  });
