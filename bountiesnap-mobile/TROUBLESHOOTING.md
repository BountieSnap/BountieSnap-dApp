# Troubleshooting Wallet Creation Issues

## Current Error
```
LOG  Creating wallet for user: 49e27837-6818-478d-abd7-35f5163130f4
ERROR  Error storing wallet data: {}
ERROR  Failed to store wallet data: {}
ERROR  Failed to create wallet: {}
```

## Step-by-Step Debugging

### 1. Check Environment Variables
First, verify all environment variables are properly set:

```bash
# Check if .env file exists
ls -la .env

# Verify environment variables are loaded (check Expo Metro logs)
```

Required variables:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_CAVOS_API_KEY`

### 2. Verify Supabase Database Setup

#### Check if user_wallets table exists
1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Look for `user_wallets` table

If the table doesn't exist, run the SQL from `supabase-schema.sql`:

```sql
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
```

### 3. Test Database Connection
Use the debug screen to test:

1. Add DebugScreen to your navigation temporarily
2. Check environment variables
3. Test database connection
4. Test wallet creation manually

### 4. Common Issues and Solutions

#### Issue: Table doesn't exist
**Error:** `relation "user_wallets" does not exist`
**Solution:** Run the SQL schema from `supabase-schema.sql`

#### Issue: RLS Policy blocking access
**Error:** `new row violates row-level security policy`
**Solution:** Check RLS policies are correctly set

#### Issue: Missing Cavos API Key
**Error:** `CAVOS_API_KEY is not configured`
**Solution:** Add `EXPO_PUBLIC_CAVOS_API_KEY` to .env file

#### Issue: Invalid Cavos API Key
**Error:** `Wallet creation failed: 401`
**Solution:** Verify API key is correct and active

#### Issue: Network connectivity
**Error:** `Network request failed`
**Solution:** Check internet connection and API endpoints

### 5. Enable Debug Mode

To get detailed error logs, the code has been updated with:
- Detailed error logging in `utils/supabase.ts`
- Detailed error logging in `utils/utils.ts`
- Database connection testing
- Environment variable validation

### 6. Temporary Debug Navigation

Add this to your `App.tsx` to access debug screen:

```typescript
// In your TabNavigator function, add:
<Tab.Screen name="Debug" component={DebugScreen} />
```

### 7. Manual Testing Steps

1. **Test Environment Variables**
   - Click "Check Environment Variables"
   - Ensure all show ✅ Set

2. **Test Database Connection**
   - Click "Test Database Connection"
   - Should show ✅ Database connection successful

3. **Test Wallet Creation**
   - Click "Test Wallet Creation"
   - Monitor logs for detailed error information

### 8. Expected Wallet Response Format

The Cavos API should return something like:
```json
{
  "address": "0x123...",
  "public_key": "0x456...",
  "private_key": "0x789...",
  "network": "sepolia"
}
```

### 9. Check Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to Logs
3. Check for any database errors or RLS policy violations

### 10. Test with Simplified Data

If all else fails, try inserting a simple test record manually:

```sql
-- Test insert (replace with actual user ID)
INSERT INTO user_wallets (id, wallet_address, wallet_data, network)
VALUES (
  '49e27837-6818-478d-abd7-35f5163130f4',
  '0xtest123',
  '{"test": true}',
  'sepolia'
);
```

## Next Steps

1. Add the debug screen to your navigation
2. Run through the tests in order
3. Check the detailed logs for specific error messages
4. If you're still getting `{}` errors, there might be a serialization issue with the error objects

The improved logging should now show you exactly what's failing! 