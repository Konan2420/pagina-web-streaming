-- TABLA DE SERVICIOS
-- Define qué plataformas vendemos (Netflix, HBO, Disney+, etc.)
CREATE TABLE public.servicios_streaming (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    categoria text NOT NULL, -- streaming, musica, ia, juegos
    icono text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.servicios_streaming TO authenticated;
GRANT SELECT ON public.servicios_streaming TO anon;
GRANT ALL ON public.servicios_streaming TO service_role;

ALTER TABLE public.servicios_streaming ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver los servicios"
ON public.servicios_streaming FOR SELECT
USING (true);

-- TABLA DE CUENTAS EN STOCK
-- Almacena las credenciales que se entregarán automáticamente
CREATE TABLE public.cuentas_stock (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id uuid REFERENCES public.servicios_streaming(id) ON DELETE CASCADE NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    perfil text, -- Opcional: Nombre del perfil o PIN
    vencimiento date,
    estado text DEFAULT 'disponible' CHECK (estado IN ('disponible', 'vendido', 'expirado')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Solo el admin puede ver y gestionar el stock completo
GRANT ALL ON public.cuentas_stock TO service_role;
GRANT SELECT ON public.cuentas_stock TO authenticated; -- Para que el usuario vea su cuenta asignada via joins o funciones

ALTER TABLE public.cuentas_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins pueden gestionar stock"
ON public.cuentas_stock FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- TABLA DE VENTAS AUTOMÁTICAS
-- Registra la transacción y qué cuenta se entregó
CREATE TABLE public.ventas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    cuenta_id uuid REFERENCES public.cuentas_stock(id),
    producto_nombre text NOT NULL,
    monto numeric(10,2) NOT NULL,
    metodo_pago text,
    estado_pago text DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'completado', 'fallido')),
    created_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.ventas TO authenticated;
GRANT ALL ON public.ventas TO service_role;

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias compras"
ON public.ventas FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins pueden ver todas las ventas"
ON public.ventas FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- FUNCIÓN DE ASIGNACIÓN ATÓMICA
-- Esta función busca una cuenta disponible, la marca como vendida y crea la venta en un solo paso
CREATE OR REPLACE FUNCTION public.asignar_cuenta_streaming(
    p_user_id uuid,
    p_servicio_slug text,
    p_monto numeric,
    p_metodo_pago text
)
RETURNS TABLE (
    venta_id uuid,
    email text,
    password text,
    perfil text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_servicio_id uuid;
    v_cuenta_id uuid;
    v_venta_id uuid;
    v_email text;
    v_password text;
    v_perfil text;
BEGIN
    -- 1. Obtener el ID del servicio
    SELECT id INTO v_servicio_id FROM public.servicios_streaming WHERE slug = p_servicio_slug;
    
    IF v_servicio_id IS NULL THEN
        RAISE EXCEPTION 'Servicio no encontrado';
    END IF;

    -- 2. Bloquear y obtener una cuenta disponible (FOR UPDATE para evitar race conditions)
    SELECT id, email, password, perfil INTO v_cuenta_id, v_email, v_password, v_perfil
    FROM public.cuentas_stock
    WHERE servicio_id = v_servicio_id AND estado = 'disponible'
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_cuenta_id IS NULL THEN
        RAISE EXCEPTION 'No hay stock disponible para este servicio';
    END IF;

    -- 3. Marcar como vendida
    UPDATE public.cuentas_stock
    SET estado = 'vendido', updated_at = now()
    WHERE id = v_cuenta_id;

    -- 4. Registrar la venta
    INSERT INTO public.ventas (user_id, cuenta_id, producto_nombre, monto, metodo_pago, estado_pago)
    VALUES (p_user_id, v_cuenta_id, p_servicio_slug, p_monto, p_metodo_pago, 'completado')
    RETURNING id INTO v_venta_id;

    RETURN QUERY SELECT v_venta_id, v_email, v_password, v_perfil;
END;
$$;
