-- Update the bounties table status constraint to include 'pending' status
-- This allows bounties to be created in pending state before blockchain confirmation

ALTER TABLE public.bounties 
DROP CONSTRAINT IF EXISTS bounties_status_check;

ALTER TABLE public.bounties 
ADD CONSTRAINT bounties_status_check 
CHECK (status IN ('pending', 'open', 'accepted', 'in_progress', 'completed', 'cancelled')); 