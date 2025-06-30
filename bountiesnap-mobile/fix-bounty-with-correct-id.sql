-- Fix the bounty with the correct on-chain ID we extracted
-- Bounty ID: 0x12 (extracted from transaction event)

UPDATE public.bounties 
SET 
  on_chain_id = '0x12',  -- The actual bounty ID from the BountyCreated event
  status = 'open'        -- Change from 'manual_id_needed' to 'open'
WHERE transaction_hash = '0xc4405e1df32bd9d0ac9c0795648b9541b2851e374097d2b04c9f77be276cf';

-- Also fix the RLS policies for bounty applications (to fix the approval issue)
DROP POLICY IF EXISTS "Hunters can update own applications" ON public.bounty_applications;
DROP POLICY IF EXISTS "Creators can update applications for their bounties" ON public.bounty_applications;

-- Policy 1: Hunters can update their own applications
CREATE POLICY "Hunters can update own applications" ON public.bounty_applications
  FOR UPDATE USING (auth.uid() = hunter_id);

-- Policy 2: Bounty creators can update applications for their bounties
CREATE POLICY "Creators can update applications for their bounties" ON public.bounty_applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT creator_id FROM public.bounties WHERE id = bounty_id
    )
  );

-- Verify the fix worked
SELECT 
  id,
  on_chain_id,
  status,
  title,
  created_at
FROM public.bounties 
WHERE on_chain_id = '0x12'
   OR transaction_hash = '0xc4405e1df32bd9d0ac9c0795648b9541b2851e374097d2b04c9f77be276cf';

-- Show recent bounties for context
SELECT 
  id,
  on_chain_id,
  status,
  title,
  created_at
FROM public.bounties 
ORDER BY created_at DESC 
LIMIT 3; 