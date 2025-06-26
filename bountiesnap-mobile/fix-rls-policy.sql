-- First, drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert their own wallet" ON user_wallets;

-- Create a more permissive insert policy that works during signup
-- This allows inserts when the user ID matches OR when there's no existing wallet for that user
CREATE POLICY "Users can insert their own wallet" ON user_wallets
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id OR 
    (
      -- Allow insert if no wallet exists for this user yet (signup scenario)
      NOT EXISTS (SELECT 1 FROM user_wallets WHERE user_wallets.id = NEW.id)
    )
  );

-- Alternative: Create a separate policy for service role access
-- This allows the service role to insert wallets during signup
CREATE POLICY "Service role can insert wallets" ON user_wallets
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    auth.uid() = id
  ); 