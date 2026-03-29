-- Migration: Phase 1 Task Tracking Sequence Integration
-- Enforcing the creation of tracking tables mapping real-time task statuses and robust time stamping.

-- 1. Create the sequence table mapped to bookings securely.
CREATE TABLE IF NOT EXISTS public.task_tracking (
    booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
    tasker_id UUID REFERENCES public.users(id),
    client_id UUID REFERENCES public.users(id),
    status TEXT NOT NULL CHECK (status IN ('accepted', 'en_route', 'arrived', 'in_progress', 'completed')),
    tasker_lat FLOAT8,
    tasker_lng FLOAT8,
    client_lat FLOAT8,
    client_lng FLOAT8,
    accepted_at TIMESTAMPTZ,
    en_route_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS natively so arbitrary users cannot inject geolocation
ALTER TABLE public.task_tracking ENABLE ROW LEVEL SECURITY;

-- Clients can seamlessly fetch records predicting the physical driver's presence
CREATE POLICY "Clients can view their own task tracking"
ON public.task_tracking FOR SELECT
USING (auth.uid() = client_id);

-- Taskers can push updates dynamically provided they own the specific tracking log via assignment
CREATE POLICY "Taskers can manage their assigned trackings"
ON public.task_tracking FOR ALL
USING (auth.uid() = tasker_id)
WITH CHECK (auth.uid() = tasker_id);


-- 2. Prevent logical skips via mathematically constrained logic bounds.
CREATE OR REPLACE FUNCTION enforce_tracking_status_progression()
RETURNS TRIGGER AS $$
BEGIN
    -- Only execute state progression rules if the status explicitly moves
    IF NEW.status != OLD.status THEN
        -- Check structural state sequences
        IF OLD.status = 'accepted' AND NEW.status != 'en_route' THEN
            RAISE EXCEPTION 'Invalid Status Progression: Must be en_route before %', NEW.status;
        END IF;

        IF OLD.status = 'en_route' AND NEW.status != 'arrived' THEN
            RAISE EXCEPTION 'Invalid Status Progression: Must be arrived before %', NEW.status;
        END IF;

        IF OLD.status = 'arrived' AND NEW.status != 'in_progress' THEN
            RAISE EXCEPTION 'Invalid Status Progression: Must be in_progress before %', NEW.status;
        END IF;

        IF OLD.status = 'in_progress' AND NEW.status != 'completed' THEN
            RAISE EXCEPTION 'Invalid Status Progression: Must be completed before %', NEW.status;
        END IF;

        IF OLD.status = 'completed' THEN
            RAISE EXCEPTION 'Invalid Status Progression: Cannot alter a completed task sequence.';
        END IF;

        -- Implicitly stamp the transition time server-side natively bypassing JS client clock trust
        IF NEW.status = 'accepted' THEN NEW.accepted_at = NOW(); END IF;
        IF NEW.status = 'en_route' THEN NEW.en_route_at = NOW(); END IF;
        IF NEW.status = 'arrived' THEN NEW.arrived_at = NOW(); END IF;
        IF NEW.status = 'in_progress' THEN NEW.started_at = NOW(); END IF;
        IF NEW.status = 'completed' THEN NEW.completed_at = NOW(); END IF;
    END IF;

    -- Consistently bump the `updated_at` modification flag
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_enforce_tracking_status_progression ON public.task_tracking;
CREATE TRIGGER trigger_enforce_tracking_status_progression
BEFORE UPDATE ON public.task_tracking
FOR EACH ROW
EXECUTE FUNCTION enforce_tracking_status_progression();


-- 3. Automatic synchronization ensuring base generic bookings table correctly recognizes our completion stage boundaries natively
CREATE OR REPLACE FUNCTION sync_booking_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if the tracked status differs to prevent circular infinite loops natively
    IF NEW.status != OLD.status THEN
        -- We inherently map 'in_progress' correctly back to bookings too.
        UPDATE public.bookings
        SET status = NEW.status
        WHERE id = NEW.booking_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_booking_status ON public.task_tracking;
CREATE TRIGGER trigger_sync_booking_status
AFTER UPDATE ON public.task_tracking
FOR EACH ROW
EXECUTE FUNCTION sync_booking_status();

-- Enable replication safely allowing frontend clients to instantly subscribe functionally!
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_tracking;
