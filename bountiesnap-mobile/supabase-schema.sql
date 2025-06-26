-- Create user_wallets table to store wallet information
CREATE TABLE user_wallets (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  wallet_data JSONB NOT NULL,
  network TEXT DEFAULT 'sepolia',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own wallet
CREATE POLICY "Users can view their own wallet" ON user_wallets
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can insert their own wallet
CREATE POLICY "Users can insert their own wallet" ON user_wallets
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own wallet
CREATE POLICY "Users can update their own wallet" ON user_wallets
  FOR UPDATE USING (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_wallets_updated_at
    BEFORE UPDATE ON user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create an index on wallet_address for faster lookups
CREATE INDEX idx_user_wallets_address ON user_wallets(wallet_address);

-- Optional: Create an index on network
CREATE INDEX idx_user_wallets_network ON user_wallets(network); 