-- Fix RLS policy for bounty_applications to allow bounty creators to approve hunters
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

-- Also ensure anyone can read applications (this should already exist)
DROP POLICY IF EXISTS "Anyone can view bounty applications" ON public.bounty_applications;
CREATE POLICY "Anyone can view bounty applications" ON public.bounty_applications
  FOR SELECT USING (true);

-- Hunters can still create their own applications
DROP POLICY IF EXISTS "Users can create applications" ON public.bounty_applications;
CREATE POLICY "Users can create applications" ON public.bounty_applications
  FOR INSERT WITH CHECK (auth.uid() = hunter_id); 