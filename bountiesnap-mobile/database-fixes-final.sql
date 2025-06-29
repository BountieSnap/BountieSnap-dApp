-- Final database fixes for bounty ID management
-- Includes support for manual ID extraction status

-- 1. Update bounty status constraint to include all possible statuses
ALTER TABLE public.bounties 
DROP CONSTRAINT IF EXISTS bounties_status_check;

ALTER TABLE public.bounties 
ADD CONSTRAINT bounties_status_check 
CHECK (status IN ('pending', 'open', 'accepted', 'in_progress', 'completed', 'cancelled', 'manual_id_needed'));

-- 2. Make transaction_hash nullable (already done in previous fixes but ensuring it's applied)
ALTER TABLE public.bounties 
ALTER COLUMN transaction_hash DROP NOT NULL;

ALTER TABLE public.bounty_applications 
ALTER COLUMN transaction_hash DROP NOT NULL;

-- 3. Add index on on_chain_id for faster lookups during applications
CREATE INDEX IF NOT EXISTS idx_bounties_on_chain_id ON public.bounties(on_chain_id);

-- 4. Add index on transaction_hash for tracking purposes
CREATE INDEX IF NOT EXISTS idx_bounties_transaction_hash ON public.bounties(transaction_hash);

-- 5. Show current bounties that might need manual ID extraction
SELECT 
  id,
  on_chain_id,
  transaction_hash,
  title,
  status,
  created_at
FROM public.bounties 
WHERE on_chain_id = 'pending' 
   OR on_chain_id LIKE 'MANUAL_EXTRACT_%'
   OR status = 'manual_id_needed'
ORDER BY created_at DESC; 