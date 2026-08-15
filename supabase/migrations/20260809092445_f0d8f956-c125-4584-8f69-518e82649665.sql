
-- Add back the missing insert policies for analytics events
-- These were previously revoked, but are required for the server functions to track events.

GRANT INSERT ON public.analytics_events TO anon;
GRANT INSERT ON public.analytics_events TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'analytics_events' 
        AND policyname = 'Anonymous and authenticated users can insert events'
    ) THEN
        CREATE POLICY "Anonymous and authenticated users can insert events" 
        ON public.analytics_events
        FOR INSERT 
        TO anon, authenticated 
        WITH CHECK (true);
    END IF;
END
$$;
