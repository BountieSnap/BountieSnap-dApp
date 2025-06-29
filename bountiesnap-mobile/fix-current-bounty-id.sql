-- Fix the current bounty with the actual ID from the BountyCreated event
-- Based on the Voyager event data showing bounty_id: "0x11"

-- Update the most recent bounty to use the correct on-chain ID
UPDATE public.bounties 
SET 
  on_chain_id = '0x11',  -- The actual ID from the BountyCreated event
  status = 'open'        -- Set to open since it's now properly identified  
WHERE transaction_hash = '0x6f6617054808b204d07e9e24f086901da1a44446aec07bbff39d694f7f4cbb0'
   OR transaction_hash = '0x566b05bb421ec0e43aed043c6834dc628b1cdb3cfeccd12c6fdc0929bda6320'; -- In case there's a newer transaction

-- Verify the update
SELECT 
  id,
  on_chain_id,
  transaction_hash,
  title,
  status,
  created_at
FROM public.bounties 
WHERE on_chain_id = '0x11'
   OR transaction_hash LIKE '%566b05bb421ec0e43aed043c6834dc628b1cdb3cfeccd12c6fdc0929bda6320%'
   OR transaction_hash LIKE '%6f6617054808b204d07e9e24f086901da1a44446aec07bbff39d694f7f4cbb0%';

-- Show recent bounties for context
SELECT 
  id,
  on_chain_id,
  transaction_hash,
  title,
  status,
  created_at
FROM public.bounties 
ORDER BY created_at DESC 
LIMIT 5; 