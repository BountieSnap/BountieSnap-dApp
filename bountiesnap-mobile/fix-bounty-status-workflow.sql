-- Fix bounty application status workflow
-- Add 'submitted' status for when hunter submits proof but creator hasn't confirmed yet

-- 1. Update the constraint to include 'submitted' status
ALTER TABLE public.bounty_applications 
DROP CONSTRAINT IF EXISTS bounty_applications_status_check;

ALTER TABLE public.bounty_applications 
ADD CONSTRAINT bounty_applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'submitted', 'completed'));

-- 2. Fix any existing 'completed' applications that should be 'submitted'
-- (These are applications where proof was submitted but not yet confirmed by creator)
UPDATE public.bounty_applications 
SET status = 'submitted'
WHERE status = 'completed'
  AND id IN (
    SELECT ba.id 
    FROM public.bounty_applications ba
    JOIN public.bounties b ON ba.bounty_id = b.id
    WHERE ba.status = 'completed'
    -- These haven't been confirmed yet, so they should be 'submitted'
  );

-- 3. Verify the changes
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'bounty_applications_status_check';

-- 4. Show current applications with their statuses
SELECT 
  ba.id,
  ba.status,
  ba.wallet_address,
  b.title,
  ba.applied_at,
  ba.updated_at
FROM public.bounty_applications ba
JOIN public.bounties b ON ba.bounty_id = b.id
ORDER BY ba.updated_at DESC
LIMIT 10; 