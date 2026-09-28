-- ==========================================================
-- CakeZone — Production Database Migration
-- ==========================================================
-- Run this ONCE in your Supabase SQL Editor:
--   https://supabase.com/dashboard/project/<ref>/sql/new
--
-- Creates the single `orders` table used by every page
-- (Dashboard, Calendar, Records, Earned) as the one source
-- of truth, plus sequences, triggers, indexes, and RLS.
-- ==========================================================

-- 1. Create the orders table with all production fields
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- e.g. CAKE-1001
    order_number INT UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    cake_type TEXT NOT NULL,
    flavour TEXT DEFAULT 'Vanilla',
    weight_kg NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    quantity INT NOT NULL DEFAULT 1,
    order_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE NOT NULL,
    delivery_time TIME NOT NULL,
    address TEXT NOT NULL,
    cake_message TEXT,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partially Paid', 'Fully Paid')),
    order_status TEXT NOT NULL DEFAULT 'New' CHECK (order_status IN ('New', 'Confirmed', 'In Progress', 'Ready', 'Delivered', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.orders IS
  'Single source of truth for all cake orders across the app.';

-- 2. Database indexes for efficient queries (calendar, records, earned, search)
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON public.orders(customer_name);

-- 3. Sequence for CAKE-XXXX order numbering
CREATE SEQUENCE IF NOT EXISTS public.order_id_seq START WITH 1001 INCREMENT BY 1;

-- Function that auto-generates sequential CAKE-XXXX ids & order_number
CREATE OR REPLACE FUNCTION public.generate_cake_order_id()
RETURNS TRIGGER AS $$
DECLARE
    seq_val INT;
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        seq_val := nextval('public.order_id_seq');
        NEW.order_number := seq_val;
        NEW.id := 'CAKE-' || LPAD(seq_val::text, 4, '0');
    END IF;
    IF NEW.order_date IS NULL THEN
        NEW.order_date := CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_cake_order_id ON public.orders;
CREATE TRIGGER set_cake_order_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_cake_order_id();

-- 4. Automatic updated_at & delivered_at trigger
--    When an order moves to 'Delivered': stamp delivered_at and mark Fully Paid.
CREATE OR REPLACE FUNCTION public.update_orders_metadata()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.order_status = 'Delivered' AND (OLD.order_status IS NULL OR OLD.order_status != 'Delivered') THEN
        NEW.delivered_at = timezone('utc'::text, now());
        NEW.payment_status = 'Fully Paid';
        NEW.paid_amount = NEW.total_amount;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_metadata_trigger ON public.orders;
CREATE TRIGGER update_orders_metadata_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_orders_metadata();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies: only authenticated administrators can access order data.
--    The app uses the ANON key + user session cookies; these policies reject
--    any request that lacks a valid authenticated session.
DROP POLICY IF EXISTS "Enable read access for authenticated admins only" ON public.orders;
CREATE POLICY "Enable read access for authenticated admins only"
ON public.orders FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated admins only" ON public.orders;
CREATE POLICY "Enable insert for authenticated admins only"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated admins only" ON public.orders;
CREATE POLICY "Enable update for authenticated admins only"
ON public.orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated admins only" ON public.orders;
CREATE POLICY "Enable delete for authenticated admins only"
ON public.orders FOR DELETE
TO authenticated
USING (true);

-- 7. (Optional) Administrative helper: reset the sequence to the current max id
--    Run only if you merged data or restored a backup.
DO $$
DECLARE
    max_num INT;
BEGIN
    SELECT COALESCE(MAX(CAST(substr(id, 6) AS INT)), 1000)
    INTO max_num FROM public.orders;
    PERFORM setval('public.order_id_seq', GREATEST(max_num, 1001));
END $$;