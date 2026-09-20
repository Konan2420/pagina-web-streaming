/**
 * Secciones de los paneles de negocio, tal como las pinta `AppTopbar` en su segunda fila.
 *
 * Vive aparte del topbar porque tres sitios distintos necesitan la misma lista: los dos shells
 * protegidos (`SupplierLayout`, `DistributorLayout`) y la propia landing, que monta el mismo
 * `AppTopbar` pero no pasa por esos shells. Sin esto, `/proveedor/productos` o
 * `/proveedor/inventario` solo eran alcanzables escribiendo la URL.
 *
 * Las rutas van como unión literal, no como `string`: el `to` de `Link` está tipado contra el
 * árbol de rutas generado, así que un `string` suelto no compila.
 */
export type BusinessSectionHref =
  | "/proveedor"
  | "/proveedor/productos"
  | "/proveedor/inventario"
  | "/proveedor/ventas"
  | "/proveedor/mi-tienda"
  | "/distribuidor"
  | "/distribuidor/mi-tienda";

export type BusinessSection = { label: string; to: BusinessSectionHref };

export const providerSections: readonly BusinessSection[] = [
  { label: "Resumen", to: "/proveedor" },
  { label: "Productos", to: "/proveedor/productos" },
  { label: "Inventario", to: "/proveedor/inventario" },
  { label: "Ventas", to: "/proveedor/ventas" },
  { label: "Mi Tienda", to: "/proveedor/mi-tienda" },
];

/**
 * El panel de distribuidor solo tiene estas dos a propósito: su Resumen anuncia que pedidos,
 * clientes y comisiones aparecerán cuando administración se los asigne.
 */
export const distributorSections: readonly BusinessSection[] = [
  { label: "Resumen", to: "/distribuidor" },
  { label: "Mi Tienda", to: "/distribuidor/mi-tienda" },
];
