-- Check column names for 'products' table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND table_schema = 'public';