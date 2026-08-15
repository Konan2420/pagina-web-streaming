-- 1. Actualizar el enum app_role para incluir 'proveedor'
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'proveedor') THEN
        ALTER TYPE public.app_role ADD VALUE 'proveedor';
    END IF;
END $$;

-- 2. Crear tabla de perfiles de proveedores
CREATE TABLE IF NOT EXISTS public.supplier_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    rating NUMERIC(3,2) DEFAULT 5.00,
    total_sales INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id)
);

-- 3. Extender tablas existentes con supplier_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'products' AND column_name = 'supplier_id') THEN
        ALTER TABLE public.products ADD COLUMN supplier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'account_inventory' AND column_name = 'supplier_id') THEN
        ALTER TABLE public.account_inventory ADD COLUMN supplier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Grants
GRANT SELECT ON public.supplier_profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.supplier_profiles TO authenticated;
GRANT ALL ON public.supplier_profiles TO service_role;

-- 5. Habilitar RLS
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para supplier_profiles
DROP POLICY IF EXISTS "Public supplier profiles are viewable by everyone" ON public.supplier_profiles;
CREATE POLICY "Public supplier profiles are viewable by everyone" 
ON public.supplier_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own supplier profile" ON public.supplier_profiles;
CREATE POLICY "Users can manage their own supplier profile" 
ON public.supplier_profiles FOR ALL TO authenticated 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 7. Actualizar RLS para account_inventory
DROP POLICY IF EXISTS "Providers can manage their own inventory" ON public.account_inventory;
CREATE POLICY "Providers can manage their own inventory" 
ON public.account_inventory FOR ALL TO authenticated 
USING (
    supplier_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
);

-- 8. Actualizar RLS para products
DROP POLICY IF EXISTS "Providers can see their assigned products" ON public.products;
CREATE POLICY "Providers can see their assigned products" 
ON public.products FOR SELECT TO authenticated 
USING (
    supplier_id = auth.uid() 
    OR is_active = true 
    OR public.has_role(auth.uid(), 'admin')
);

-- 9. Trigger para sincronizar ventas de proveedores
CREATE OR REPLACE FUNCTION public.track_supplier_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'assigned' AND NEW.supplier_id IS NOT NULL THEN
        UPDATE public.supplier_profiles 
        SET total_sales = total_sales + 1
        WHERE user_id = NEW.supplier_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_inventory_assigned ON public.account_inventory;
CREATE TRIGGER on_inventory_assigned
    AFTER UPDATE OF status ON public.account_inventory
    FOR EACH ROW
    WHEN (OLD.status = 'available' AND NEW.status = 'assigned')
    EXECUTE FUNCTION public.track_supplier_sale();
