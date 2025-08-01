-- Create user_wallets table (if it doesn't exist)
create table if not exists public.user_wallets (
  id uuid references auth.users(id) on delete cascade primary key,
  wallet_address text not null,
  private_key text,
  public_key text,
  wallet_data jsonb not null,
  network text default 'sepolia',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create RLS policies for user_wallets (if they don't exist)
do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'user_wallets' and policyname = 'Users can view their own wallet') then
    create policy "Users can view their own wallet" on public.user_wallets
      for select using (auth.uid() = id);
  end if;
  
  if not exists (select 1 from pg_policies where tablename = 'user_wallets' and policyname = 'Users can insert their own wallet') then
    create policy "Users can insert their own wallet" on public.user_wallets
      for insert with check (auth.uid() = id);
  end if;
  
  if not exists (select 1 from pg_policies where tablename = 'user_wallets' and policyname = 'Users can update their own wallet') then
    create policy "Users can update their own wallet" on public.user_wallets
      for update using (auth.uid() = id);
  end if;
end $$;

-- Create bounties table
create table if not exists public.bounties (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references auth.users(id) on delete cascade not null,
  on_chain_id text not null, -- The bounty ID from the smart contract
  title text not null,
  description text not null,
  amount text not null, -- Amount in wei (string to handle big numbers)
  amount_strk decimal, -- Amount in STRK for display (calculated)
  deadline timestamp with time zone not null,
  status text default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  transaction_hash text not null, -- Hash of the creation transaction
  wallet_address text not null, -- Creator's wallet address
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create bounty_applications table
create table if not exists public.bounty_applications (
  id uuid default gen_random_uuid() primary key,
  bounty_id uuid references public.bounties(id) on delete cascade not null,
  hunter_id uuid references auth.users(id) on delete cascade not null,
  stake_amount text not null, -- Stake amount in wei
  stake_amount_strk decimal, -- Stake amount in STRK for display
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  transaction_hash text, -- Hash of the application transaction
  wallet_address text not null, -- Hunter's wallet address
  applied_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies for bounties
create policy "Anyone can view bounties" on public.bounties
  for select using (true);

create policy "Users can create bounties" on public.bounties
  for insert with check (auth.uid() = creator_id);

create policy "Creators can update own bounties" on public.bounties
  for update using (auth.uid() = creator_id);

-- Create RLS policies for bounty_applications
create policy "Anyone can view bounty applications" on public.bounty_applications
  for select using (true);

create policy "Users can create applications" on public.bounty_applications
  for insert with check (auth.uid() = hunter_id);

create policy "Hunters can update own applications" on public.bounty_applications
  for update using (auth.uid() = hunter_id);

-- Create indexes for better performance
create index if not exists idx_bounties_status on public.bounties(status);
create index if not exists idx_bounties_creator on public.bounties(creator_id);
create index if not exists idx_bounties_deadline on public.bounties(deadline);
create index if not exists idx_bounty_applications_bounty on public.bounty_applications(bounty_id);
create index if not exists idx_bounty_applications_hunter on public.bounty_applications(hunter_id);

-- Enable RLS on new tables
alter table public.user_wallets enable row level security;
alter table public.bounties enable row level security;
alter table public.bounty_applications enable row level security;

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