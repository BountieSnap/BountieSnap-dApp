-- Database fixes for bounty ID management system
-- Run this script to update your database schema

-- 1. Update bounty status constraint to include 'pending'
ALTER TABLE public.bounties 
DROP CONSTRAINT IF EXISTS bounties_status_check;

ALTER TABLE public.bounties 
ADD CONSTRAINT bounties_status_check 
CHECK (status IN ('pending', 'open', 'accepted', 'in_progress', 'completed', 'cancelled'));

-- 2. Make transaction_hash nullable (allows records to be created before blockchain transactions)
ALTER TABLE public.bounties 
ALTER COLUMN transaction_hash DROP NOT NULL;

ALTER TABLE public.bounty_applications 
ALTER COLUMN transaction_hash DROP NOT NULL;

-- Verify the changes
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('bounties', 'bounty_applications') 
  AND column_name = 'transaction_hash';

SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'bounties_status_check'; 