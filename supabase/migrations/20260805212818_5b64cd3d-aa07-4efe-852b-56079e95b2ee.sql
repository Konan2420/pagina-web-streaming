-- Create manual_orders table for tracking WhatsApp orders
CREATE TABLE IF NOT EXISTS public.manual_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    producto_nombre TEXT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fecha_adquisicion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    whatsapp_cliente TEXT,
    nombre_cliente TEXT,
    estado TEXT DEFAULT 'verificado' CHECK (estado IN ('pendiente', 'verificado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.manual_orders ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_orders TO authenticated;
GRANT ALL ON public.manual_orders TO service_role;
GRANT SELECT ON public.manual_orders TO anon;

-- Policies
DROP POLICY IF EXISTS "Users can view their own manual orders" ON public.manual_orders;
CREATE POLICY "Users can view their own manual orders" 
ON public.manual_orders FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all manual orders" ON public.manual_orders;
CREATE POLICY "Admins can manage all manual orders" 
ON public.manual_orders FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));
