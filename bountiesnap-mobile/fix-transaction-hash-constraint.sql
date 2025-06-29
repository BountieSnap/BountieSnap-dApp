-- Fix transaction_hash constraint to allow NULL values
-- This allows bounties to be created before blockchain transactions complete

-- Make transaction_hash nullable for bounties table
ALTER TABLE public.bounties 
ALTER COLUMN transaction_hash DROP NOT NULL;

-- Make transaction_hash nullable for bounty_applications table
ALTER TABLE public.bounty_applications 
ALTER COLUMN transaction_hash DROP NOT NULL; 