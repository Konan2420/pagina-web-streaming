# Auditoría del catálogo CMD Streaming — 7 de octubre de 2026

## 1. Arquitectura encontrada

- TanStack Start/Router, React, Vite y Supabase. La portada `/` y la ruta autenticada `/catalogo` montan `TiendaPage`; la barra de categorías es `PlatformNavigation`, el buscador y los filtros son `CatalogToolbar`, las tarjetas son `ProductCatalogCard` y la ficha/compra es `ProductModal`.
- Los productos vienen de `public.products`, las plataformas de `public.servicios_streaming`, el conteo de stock de `public.product_stock` y la actividad agregada de `get_catalog_product_activity`. No hay productos escritos manualmente en el listado.
- El acceso usa Supabase Auth y rutas privadas. `products` tiene RLS para productos activos y aprobados. La creación de productos de proveedor fuerza `approval_status = 'pending'`; la administración aprueba o rechaza. El valor `pending_review` propuesto en el pedido no existe en la base y no debe introducirse sin migrar todos los consumidores.
- `account_inventory` separa las unidades/credenciales de `products`. Cada fila de `products` ya tiene precio y duración propios, pero no hay una entidad de variantes agrupadas. Unidades distintas pueden corresponder a productos distintos; crear `product_variants` implicaría modificar editores, RLS, stock, compras, entregas, tiendas y eventos.
- El carrito llama a la Server Function `createOrders` y al RPC `place_orders_with_inventory`; la ficha usa `place_catalog_order_from_wallet`. El cobro y la asignación de inventario ocurren en transacciones SQL con bloqueo de stock y saldo. El navegador no decide el precio final. La idempotencia de peticiones repetidas aún no existe en servidor.
- La billetera utiliza `wallet_balances` y `wallet_transactions`. Los roles son admin, proveedor, distribuidor y usuario, con comprobaciones en rutas, Server Functions y SQL/RLS. El panel admin, productos y stock viven en rutas independientes.

## 2. Problemas y oportunidades verificables

1. El buscador del catálogo compara únicamente `product.name`; no encuentra categoría, tipo o vendedor público.
2. El estado de búsqueda/categoría vive solo en React. `/catalogo?q=...` y `/catalogo?categoria=...` no se aplican al abrir la URL y las selecciones no se pueden compartir.
3. La ruta `/catalogo` redirige proveedores, distribuidores y admins a sus paneles aunque estos roles sí pueden abrir el catálogo desde la portada.
4. La barra de categorías procede de un arreglo fijo. `products.category` y las categorías de servicios pueden contener valores nuevos que no aparecen como filtro.
5. `TiendaPage` concentra carga, filtros, carrito, pedidos y otras secciones. La extracción debe ser progresiva para conservar su comportamiento.
6. La tarjeta ya muestra imagen, glow basado en la imagen, precio, duración, stock, tipo de entrega y vendedor público. Faltan la categoría y el número agregado de ventas como datos visibles. No hay rating propio del producto; no se debe inventar.
7. Skeleton, error, vacío, toast y diseño responsive ya existen. La cuadrícula utiliza 1 columna en móvil estrecho, 2 desde 380 px y columnas fluidas desde 640 px.

## 3. Archivos de esta fase

`src/components/tienda/TiendaPage.tsx`, `src/components/tienda/CatalogToolbar.tsx`, `src/components/tienda/PlatformNavigation.tsx`, `src/components/tienda/ProductCatalogCard.tsx`, `src/components/tienda/data.ts`, `src/routes/_authenticated/catalogo.tsx` y módulos puros nuevos de taxonomía/URL si resultan necesarios. CSS solo si la presentación de datos nuevos lo exige.

## 4. Tablas y servicios implicados

Lectura: `products`, `servicios_streaming`, `product_stock`, `get_catalog_product_activity`. Compra: `account_inventory`, `orders`, `delivered_accounts`, `wallet_balances`, `wallet_transactions`, `catalog_product_costs`, `catalog_pricing_settings` y RPC de checkout. Administración: `user_roles`, `supplier_profiles`, `products`.

## 5. Riesgos

- Cambiar estados de aprobación o la identidad de producto/variante sin actualizar todos los RPC podría ocultar productos o cobrar/entregar la unidad equivocada.
- Cambiar el precio o stock a partir de valores del cliente rompería las garantías actuales; el servidor seguirá siendo autoridad.
- Ya hay migraciones locales pendientes de recargas y de endurecimiento de pedidos/analítica. No mezclar su despliegue con un cambio de taxonomía o variantes sin prueba de migración.
- No hay cuentas de ensayo de los cuatro roles ni una base local de Supabase disponible en esta sesión; las pruebas autenticadas de compra deben ejecutarse antes de afirmar un despliegue completo.

## 6. Plan de migración

1. Mejorar filtros, URLs, categorías derivadas de `products` y tarjetas con los campos ya existentes. Esta fase no requiere cambio de esquema ni altera checkout.
2. Probar navegación directa, búsqueda, filtros, stock, login y compilación; conservar los estados y el diseño actual.
3. Diseñar en una migración separada un grupo de variantes con FK/índices/RLS y adaptación de editores, stock, fichas y RPC. Las variantes existentes deben mapearse sin borrar productos ni pedidos.
4. Diseñar idempotencia de checkout con identificador de solicitud, persistencia e índice único en SQL, y adaptar todos los clientes de compra. Validar reintentos y concurrencia con cuentas de ensayo antes de aplicar en producción.
5. Extender revisión administrativa a solicitud de cambios/suspensión solamente tras definir transiciones y efectos sobre productos ya vendidos.

## Implementación local de la primera fase

- `catalog-taxonomy.ts` centraliza alias, etiquetas y búsqueda por nombre, categoría, tipo de cuenta/entrega y nombre público del proveedor. `catalog-filters.ts` reúne la combinación de categoría, servicio, precio, duración y renovación. La barra incorpora categorías halladas en `products` sin perder las opciones existentes.
- `/catalogo?q=...&categoria=...` restaura los filtros al abrirse y la interfaz mantiene esos parámetros actualizados. La ruta permite abrir el catálogo con cualquier rol autenticado; las acciones de gestión siguen verificándose por su propio rol.
- Las tarjetas muestran categoría, ventas agregadas cuando existen y la marca destacada. No se inventa un rating ni se consulta ningún dato privado del vendedor. El glow basado en la imagen ya existía y se conserva.
- La cuadrícula usa entre una y seis columnas según el ancho. La ficha de producto queda anclada al borde inferior en móvil, con espacio seguro para el botón de compra.
- No se han modificado los RPC de cobro, stock, comisiones o entrega, ni se han ejecutado migraciones. El cambio `pending_review`, las variantes agrupadas y la idempotencia entre peticiones requieren un diseño SQL y pruebas de concurrencia aparte; el cierre de una compra ya es transaccional, pero una nueva petición idéntica todavía puede crear otra compra.

## Verificación

- `npm.cmd run typecheck`: correcto.
- `npm.cmd run lint`: 0 errores; 2 advertencias preexistentes de Fast Refresh en `AvatarFrame.tsx`.
- `npm.cmd run build`: correcto.
- `git diff --check`: correcto.
- No hay cuenta de prueba ni base local disponible para ejecutar aquí una compra real o confirmar permisos de los cuatro roles en Supabase. El estado de publicación se confirma por separado en Vercel.
