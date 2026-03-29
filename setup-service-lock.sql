-- Migration: Phase 3 Service Lock
-- Purpose: Enforce tasker service lock functionally after admin approval.

-- 1. Create a function to lock tasker service on update/insert to "taskers"
CREATE OR REPLACE FUNCTION enforce_approved_service_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
  v_service TEXT;
BEGIN
  -- Check if the tasker has an approved verification record
  SELECT status, service_category 
  INTO v_status, v_service
  FROM tasker_verifications
  WHERE user_id = NEW.tasker_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- If approved, strictly overwrite their services_offered with their single approved service
  IF v_status = 'approved' AND v_service IS NOT NULL THEN
    NEW.services_offered = ARRAY[v_service];
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the taskers table
DROP TRIGGER IF EXISTS trigger_enforce_approved_service_lock ON taskers;
CREATE TRIGGER trigger_enforce_approved_service_lock
BEFORE INSERT OR UPDATE ON taskers
FOR EACH ROW
EXECUTE FUNCTION enforce_approved_service_lock();


-- 2. Create a function to synchronize taskers when an admin approves them directly
CREATE OR REPLACE FUNCTION sync_service_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When verification status changes to 'approved', update the tasker's record to lock string
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    UPDATE taskers
    SET services_offered = ARRAY[NEW.service_category]
    WHERE tasker_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the tasker_verifications table
DROP TRIGGER IF EXISTS trigger_sync_service_on_approval ON tasker_verifications;
CREATE TRIGGER trigger_sync_service_on_approval
AFTER UPDATE OF status ON tasker_verifications
FOR EACH ROW
EXECUTE FUNCTION sync_service_on_approval();


-- 3. Retroactively enforce the rule on any existing approved taskers right now
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tv.user_id, tv.service_category 
    FROM tasker_verifications tv
    JOIN users u ON u.id = tv.user_id
    WHERE tv.status = 'approved'
  LOOP
    UPDATE taskers
    SET services_offered = ARRAY[r.service_category]
    WHERE tasker_id = r.user_id;
  END LOOP;
END;
$$;
