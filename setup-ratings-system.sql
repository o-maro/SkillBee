-- This script sets up the ratings and reviews system for SkillBee.

-- 1. Create the ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tasker_id UUID NOT NULL REFERENCES public.taskers(tasker_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Prevent duplicate reviews for the same booking
    CONSTRAINT unique_booking_review UNIQUE (booking_id)
);

-- 2. Update taskers table to track total_reviews
-- It also tracks `rating` which already exists based on our inspection, but let's make sure it's 0.0 default.
ALTER TABLE public.taskers 
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- 3. Create a function and trigger to automatically update tasker's average rating 
-- and total reviews when a rating is added, updated, or deleted
CREATE OR REPLACE FUNCTION public.update_tasker_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC;
    rev_count INTEGER;
    t_id UUID;
BEGIN
    -- Determine the tasker_id based on operation
    IF TG_OP = 'DELETE' THEN
        t_id := OLD.tasker_id;
    ELSE
        t_id := NEW.tasker_id;
    END IF;

    -- Calculate the new average and count
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0), COUNT(*)
    INTO avg_rating, rev_count
    FROM public.ratings
    WHERE tasker_id = t_id;

    -- Update the tasker record
    UPDATE public.taskers
    SET rating = avg_rating,
        total_reviews = rev_count
    WHERE tasker_id = t_id;

    RETURN NULL; -- For AFTER triggers, return value is ignored
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_rating_change ON public.ratings;
CREATE TRIGGER on_rating_change
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.update_tasker_rating_stats();

-- 4. Create a function and trigger for 'completed_tasks' calculation.
-- Note: 'completed_tasks' column already exists in 'taskers'.
-- We increment it or recalculate it when a booking status changes to 'completed'.
CREATE OR REPLACE FUNCTION public.update_tasker_completed_tasks()
RETURNS TRIGGER AS $$
DECLARE
    comp_count INTEGER;
BEGIN
    -- Only act if status actually changed or is a new 'completed' booking
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Recalculate based on bookings
        SELECT COUNT(*)
        INTO comp_count
        FROM public.bookings
        WHERE tasker_id = COALESCE(NEW.tasker_id, OLD.tasker_id)
          AND status = 'completed';

        UPDATE public.taskers
        SET completed_tasks = comp_count
        WHERE tasker_id = COALESCE(NEW.tasker_id, OLD.tasker_id);
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_status_change ON public.bookings;
CREATE TRIGGER on_booking_status_change
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_tasker_completed_tasks();

-- 5. Enable Row Level Security (RLS) on ratings table
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- 6. Ratings RLS Policies
-- Anyone can read ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.ratings;
CREATE POLICY "Anyone can view ratings" 
ON public.ratings FOR SELECT 
USING (true);

-- Authenticated users can insert their own ratings
-- ensuring they are the client for the booking and the booking is completed
DROP POLICY IF EXISTS "Clients can insert ratings for completed bookings" ON public.ratings;
CREATE POLICY "Clients can insert ratings for completed bookings" 
ON public.ratings FOR INSERT 
TO authenticated
WITH CHECK (
    auth.uid() = client_id AND 
    EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = booking_id 
          AND b.client_id = auth.uid()
          AND b.status = 'completed'
    )
);

-- Clients can update their own reviews
DROP POLICY IF EXISTS "Clients can update their own ratings" ON public.ratings;
CREATE POLICY "Clients can update their own ratings" 
ON public.ratings FOR UPDATE 
TO authenticated
USING (auth.uid() = client_id);

-- Clients can delete their own reviews
DROP POLICY IF EXISTS "Clients can delete their own ratings" ON public.ratings;
CREATE POLICY "Clients can delete their own ratings" 
ON public.ratings FOR DELETE 
TO authenticated
USING (auth.uid() = client_id);
