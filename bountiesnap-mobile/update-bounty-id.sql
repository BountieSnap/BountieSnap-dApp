-- Update the recently created bounty with the correct on-chain ID
-- The old contract uses sequential IDs starting from 1

-- Update the bounty that was just created (based on the transaction hash from logs)
UPDATE public.bounties 
SET on_chain_id = '0x1'  -- First bounty created gets ID 1
WHERE transaction_hash = '0x6f6617054808b204d07e9e24f086901da1a44446aec07bbff39d694f7f4cbb0';

-- Check the update
SELECT id, on_chain_id, transaction_hash, title, status 
FROM public.bounties 
WHERE transaction_hash = '0x6f6617054808b204d07e9e24f086901da1a44446aec07bbff39d694f7f4cbb0';

-- If there are more bounties created after this, they would be:
-- Second bounty: '0x2'
-- Third bounty: '0x3'
-- etc.

-- Show all bounties to verify
SELECT id, on_chain_id, transaction_hash, title, status, created_at
FROM public.bounties 
ORDER BY created_at DESC 
LIMIT 5; 