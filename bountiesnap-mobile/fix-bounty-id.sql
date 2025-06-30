-- Fix bounty ID after manual extraction from Voyager
-- Replace 'ACTUAL_BOUNTY_ID_FROM_VOYAGER' with the real bounty ID you found

-- Step 1: Update the bounty with the correct on-chain ID
UPDATE public.bounties 
SET 
  on_chain_id = 'ACTUAL_BOUNTY_ID_FROM_VOYAGER',  -- Replace with real ID (e.g., '0x12' or '18')
  status = 'open'  -- Change from 'manual_id_needed' to 'open'
WHERE transaction_hash = '0xc4405e1df32bd9d0ac9c0795648b9541b2851e374097d2b04c9f77be276cf';

-- Step 2: Verify the update worked
SELECT id, on_chain_id, status, title 
FROM public.bounties 
WHERE transaction_hash = '0xc4405e1df32bd9d0ac9c0795648b9541b2851e374097d2b04c9f77be276cf';

-- Step 3: Also fix the RLS policies for bounty applications (from the previous issue)
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Hunters can update own applications" ON public.bounty_applications;

-- Create new policies that allow both hunters and bounty creators to update applications
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