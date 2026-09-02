/** Shared client-side routing policy. Server functions still verify permissions independently. */
export type AppRole = "admin" | "proveedor" | "distribuidor" | "user";
export type RoleDestination = "/admin" | "/proveedor" | "/distribuidor" | "/catalogo";

const rolePriority: readonly AppRole[] = ["admin", "proveedor", "distribuidor", "user"];

export const roleDestinations: Record<AppRole, RoleDestination> = {
  admin: "/admin",
  proveedor: "/proveedor",
  distribuidor: "/distribuidor",
  user: "/catalogo",
};

/** The role UI preserves `user` as a base role, therefore only the highest role is used. */
export function resolvePrimaryRole(roles: Iterable<string | null | undefined>): AppRole {
  const assignedRoles = new Set(roles);
  return rolePriority.find((role) => assignedRoles.has(role)) ?? "user";
}

export function getRoleDestination(role: AppRole): RoleDestination {
  return roleDestinations[role];
}

export function isCatalogOnlyRole(role: AppRole) {
  return role === "user";
}
