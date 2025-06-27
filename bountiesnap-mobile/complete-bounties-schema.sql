-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.bounty_applications;
DROP TABLE IF EXISTS public.bounties;
DROP TABLE IF EXISTS public.user_wallets;

-- Create enhanced bounties table with all necessary fields
CREATE TABLE public.bounties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  on_chain_id text NOT NULL, -- The bounty ID from the smart contract
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'other' CHECK (category IN ('delivery', 'shopping', 'pet-care', 'maintenance', 'other')),
  payment decimal DEFAULT 0, -- Payment amount in STRK for display
  amount text NOT NULL, -- Amount in wei (string to handle big numbers)
  amount_strk decimal, -- Amount in STRK for display (calculated)
  location_lat decimal,
  location_lng decimal,
  location_address text,
  deadline timestamp with time zone NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'in_progress', 'completed', 'cancelled')),
  transaction_hash text NOT NULL, -- Hash of the creation transaction
  wallet_address text NOT NULL, -- Creator's wallet address
  requirements text[] DEFAULT '{}', -- Array of requirements
  proof_image text, -- URL to proof image
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_wallets table
CREATE TABLE public.user_wallets (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  wallet_address text NOT NULL UNIQUE,
  private_key text,
  public_key text,
  wallet_data jsonb,
  network text DEFAULT 'sepolia',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create bounty_applications table
CREATE TABLE public.bounty_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id uuid REFERENCES public.bounties(id) ON DELETE CASCADE NOT NULL,
  hunter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stake_amount text NOT NULL, -- Stake amount in wei
  stake_amount_strk decimal, -- Stake amount in STRK for display
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  transaction_hash text, -- Hash of the application transaction
  wallet_address text NOT NULL, -- Hunter's wallet address
  applied_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bounties
CREATE POLICY "Anyone can view bounties" ON public.bounties
  FOR SELECT USING (true);

CREATE POLICY "Users can create bounties" ON public.bounties
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own bounties" ON public.bounties
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own bounties" ON public.bounties
  FOR DELETE USING (auth.uid() = creator_id);

-- Create RLS policies for user_wallets
CREATE POLICY "Users can view own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can create own wallet" ON public.user_wallets
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own wallet" ON public.user_wallets
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for bounty_applications
CREATE POLICY "Anyone can view bounty applications" ON public.bounty_applications
  FOR SELECT USING (true);

CREATE POLICY "Users can create applications" ON public.bounty_applications
  FOR INSERT WITH CHECK (auth.uid() = hunter_id);

CREATE POLICY "Hunters can update own applications" ON public.bounty_applications
  FOR UPDATE USING (auth.uid() = hunter_id);

-- Create indexes for better performance
CREATE INDEX idx_bounties_status ON public.bounties(status);
CREATE INDEX idx_bounties_creator ON public.bounties(creator_id);
CREATE INDEX idx_bounties_deadline ON public.bounties(deadline);
CREATE INDEX idx_bounties_category ON public.bounties(category);
CREATE INDEX idx_bounty_applications_bounty ON public.bounty_applications(bounty_id);
CREATE INDEX idx_bounty_applications_hunter ON public.bounty_applications(hunter_id);

-- Insert sample data (you'll need to replace the UUIDs with actual user IDs from your auth.users table)
-- First, let's create some sample users if they don't exist (optional - for testing only)
-- Note: In production, users are created through your authentication system

-- Insert sample bounties
INSERT INTO public.bounties (
  creator_id,
  on_chain_id,
  title,
  description,
  category,
  payment,
  amount,
  amount_strk,
  location_lat,
  location_lng,
  location_address,
  deadline,
  status,
  transaction_hash,
  wallet_address,
  requirements
) VALUES 
-- Sample bounty 1
(
  '880a767b-ec0c-47b0-86f1-12ec7ec6af3e', -- Replace with actual user ID
  'sample_chain_id_1',
  'Pick up prescription from CVS',
  'Need someone to pick up my heart medication. Very urgent!',
  'delivery',
  15,
  '15000000000000000000', -- 15 STRK in wei
  15,
  40.7128,
  -74.0060,
  'CVS Pharmacy, 123 Main St',
  NOW() + INTERVAL '2 hours',
  'open',
  'sample_tx_hash_1',
  '0x14237afb331890feaa4e3e757ce8818a61ef8f9531cf7a8af6406d3a2d4ccd3',
  ARRAY['Photo of receipt', 'Text when arriving']
),
-- Sample bounty 2
(
  '880a767b-ec0c-47b0-86f1-12ec7ec6af3e', -- Replace with actual user ID
  'sample_chain_id_2',
  'Walk my golden retriever',
  'Max needs a 30-minute walk around the neighborhood. He''s very friendly!',
  'pet-care',
  25,
  '25000000000000000000', -- 25 STRK in wei
  25,
  40.7589,
  -73.9851,
  'Central Park, Dog Run Area',
  NOW() + INTERVAL '6 hours',
  'open',
  'sample_tx_hash_2',
  '0x14237afb331890feaa4e3e757ce8818a61ef8f9531cf7a8af6406d3a2d4ccd3',
  ARRAY['Photo with Max', 'GPS tracking enabled']
),
-- Sample bounty 3
(
  '880a767b-ec0c-47b0-86f1-12ec7ec6af3e', -- Replace with actual user ID
  'sample_chain_id_3',
  'Grocery shopping at Whole Foods',
  'Need organic vegetables and fruits for tonight''s dinner party. List provided.',
  'shopping',
  30,
  '30000000000000000000', -- 30 STRK in wei
  30,
  40.7505,
  -73.9934,
  'Whole Foods, 456 Broadway',
  NOW() + INTERVAL '3 hours',
  'open',
  'sample_tx_hash_3',
  '0x14237afb331890feaa4e3e757ce8818a61ef8f9531cf7a8af6406d3a2d4ccd3',
  ARRAY['Receipt photo', 'Quality check photos']
);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_bounties_updated_at BEFORE UPDATE ON public.bounties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON public.user_wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bounty_applications_updated_at BEFORE UPDATE ON public.bounty_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 