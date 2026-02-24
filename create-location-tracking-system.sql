-- ============================================
-- LOCATION TRACKING SYSTEM FOR TASKS
-- Creates table and RLS policies for real-time location sharing
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add latitude/longitude columns to bookings table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'bookings' 
                   AND column_name = 'client_latitude') THEN
        ALTER TABLE public.bookings 
        ADD COLUMN client_latitude DECIMAL(10, 8),
        ADD COLUMN client_longitude DECIMAL(11, 8);
    END IF;
END $$;

-- 2. Create task_locations table
CREATE TABLE IF NOT EXISTS public.task_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    tasker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tasker_latitude DECIMAL(10, 8),
    tasker_longitude DECIMAL(11, 8),
    client_latitude DECIMAL(10, 8) NOT NULL,
    client_longitude DECIMAL(11, 8) NOT NULL,
    status TEXT NOT NULL DEFAULT 'tracking' CHECK (status IN ('tracking', 'arrived', 'completed', 'cancelled')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id)
);

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_task_locations_booking_id ON public.task_locations(booking_id);
CREATE INDEX IF NOT EXISTS idx_task_locations_tasker_id ON public.task_locations(tasker_id);
CREATE INDEX IF NOT EXISTS idx_task_locations_client_id ON public.task_locations(client_id);
CREATE INDEX IF NOT EXISTS idx_task_locations_status ON public.task_locations(status);

-- 4. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_task_locations_updated_at ON public.task_locations;
CREATE TRIGGER trigger_update_task_locations_updated_at
    BEFORE UPDATE ON public.task_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_task_locations_updated_at();

-- 6. Enable Row Level Security
ALTER TABLE public.task_locations ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policy: Taskers can read and update their own location records
CREATE POLICY "Taskers can view and update their location"
    ON public.task_locations
    FOR ALL
    USING (
        auth.uid() = tasker_id
    )
    WITH CHECK (
        auth.uid() = tasker_id
    );

-- 8. RLS Policy: Clients can read location records for their bookings
CREATE POLICY "Clients can view location for their bookings"
    ON public.task_locations
    FOR SELECT
    USING (
        auth.uid() = client_id
    );

-- 9. RLS Policy: Admins can view all location records (for moderation)
CREATE POLICY "Admins can view all locations"
    ON public.task_locations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 10. Function to automatically create location record when task is accepted
CREATE OR REPLACE FUNCTION create_task_location_on_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create location record when status changes to 'accepted' or 'in_progress'
    IF NEW.status IN ('accepted', 'in_progress') AND 
       (OLD.status IS NULL OR OLD.status NOT IN ('accepted', 'in_progress')) THEN
        
        -- Only create if client location coordinates exist
        IF NEW.client_latitude IS NOT NULL AND NEW.client_longitude IS NOT NULL THEN
            INSERT INTO public.task_locations (
                booking_id,
                tasker_id,
                client_id,
                client_latitude,
                client_longitude,
                status
            )
            VALUES (
                NEW.id,
                NEW.tasker_id,
                NEW.client_id,
                NEW.client_latitude,
                NEW.client_longitude,
                'tracking'
            )
            ON CONFLICT (booking_id) DO UPDATE SET
                status = 'tracking',
                updated_at = NOW();
        END IF;
    END IF;
    
    -- Update location status when task is completed or cancelled
    IF NEW.status IN ('completed', 'cancelled') AND OLD.status NOT IN ('completed', 'cancelled') THEN
        UPDATE public.task_locations
        SET status = NEW.status,
            updated_at = NOW()
        WHERE booking_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger to auto-create location record on task acceptance
DROP TRIGGER IF EXISTS trigger_create_task_location ON public.bookings;
CREATE TRIGGER trigger_create_task_location
    AFTER INSERT OR UPDATE OF status ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_task_location_on_acceptance();

-- 12. Function to clean up old location records (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_task_locations()
RETURNS void AS $$
BEGIN
    -- Delete location records older than 7 days for completed/cancelled tasks
    DELETE FROM public.task_locations
    WHERE status IN ('completed', 'cancelled')
    AND updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 13. Enable Realtime for task_locations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_locations;

-- Verification queries
SELECT 'Location tracking system created successfully!' AS status;
SELECT COUNT(*) AS existing_records FROM public.task_locations;

