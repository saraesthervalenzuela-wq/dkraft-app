-- ============================================
-- D-KRAFT ERP - Add Missing Columns Migration
-- Execute in Supabase SQL Editor
-- Date: 2026-02-02
-- ============================================

-- Add missing columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'México';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_id VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) DEFAULT 'Net 30';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_entity VARCHAR(20) DEFAULT 'DOVECREEK';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS qb_customer_id VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS qb_sync_token VARCHAR(10);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'local_only';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add missing columns to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'México';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tax_id VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) DEFAULT 'Net 30';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS lead_time_days INT DEFAULT 7;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS minimum_order DECIMAL(12,2) DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS rating INT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website VARCHAR(200);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS qb_vendor_id VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'local_only';

-- Verify columns were added
SELECT 'clients columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

SELECT 'suppliers columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'suppliers'
ORDER BY ordinal_position;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Migration completed! Schema cache refreshed.' as status;
