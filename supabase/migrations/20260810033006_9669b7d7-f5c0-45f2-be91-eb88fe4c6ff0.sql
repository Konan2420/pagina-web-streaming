-- Asegurar que el enum app_role incluya 'proveedor'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'app_role' AND e.enumlabel = 'proveedor') THEN
            ALTER TYPE public.app_role ADD VALUE 'proveedor';
        END IF;
    END IF;
END $$;

GRANT USAGE ON TYPE public.app_role TO authenticated, anon, service_role;
