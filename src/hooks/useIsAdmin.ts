import { useAuthState } from "@/hooks/useAuthState";

/** Reads the signed-in user's persisted roles. UI checks never replace server authorization. */
export function useIsAdmin() {
  const { isAdmin, isProvider, isDistributor, status } = useAuthState();

  return {
    isAdmin,
    isProvider,
    isDistributor,
    // Alias conservado para los componentes históricos del panel de proveedor.
    isSupplier: isProvider,
    isAuthorized: isAdmin,
    loading: status === "checking",
  };
}
