import { useAuthState } from "@/hooks/useAuthState";

/** Subscribes to Supabase auth state and returns the current session. */
export function useSupabaseSession() {
  return useAuthState().session;
}
