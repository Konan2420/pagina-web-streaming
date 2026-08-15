import { useQuery } from "@tanstack/react-query";
import { getPublicMetrics, type PublicMetrics } from "@/lib/metrics.functions";

const FALLBACK: PublicMetrics = {
  totalUsers: 0,
  totalOrders: 0,
  ordersLast7Days: 0,
  recentActivity: [],
};

/** Fetches live public metrics with cache + exponential-backoff retries. */
export function usePublicMetrics() {
  const { data } = useQuery({
    queryKey: ["public-metrics"],
    queryFn: () => getPublicMetrics(),
    // Public social proof should never delay the landing. Keep it cached during a visit.
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1_000,
  });
  return data ?? FALLBACK;
}
