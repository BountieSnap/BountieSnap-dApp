# BountieSnap Bounty System Documentation

## Overview

The BountieSnap app now includes a complete bounty system that connects on-chain smart contracts with a Supabase database for a seamless user experience.

## Features

### 🔐 Authentication & Wallet Management
- **Automatic wallet creation** during user signup
- **Secure wallet storage** in Supabase with private key encryption
- **Balance checking** for STRK tokens

### 💰 Bounty Creation
- **Multi-step bounty creation** with validation
- **On-chain bounty creation** using Starknet smart contracts
- **Database storage** for efficient querying and UI display
- **STRK token approval** and transfer handling

### 🎯 Bounty Hunting
- **Browse available bounties** with filtering
- **Apply to bounties** with stake amounts
- **Real-time application tracking**
- **Insufficient balance detection** with helpful error messages

## Database Schema

### `bounties` table
```sql
- id: UUID (primary key)
- creator_id: UUID (references auth.users)
- on_chain_id: TEXT (smart contract bounty ID)
- title: TEXT
- description: TEXT
- amount: TEXT (amount in wei)
- amount_strk: DECIMAL (amount in STRK for display)
- deadline: TIMESTAMP
- status: TEXT (open, in_progress, completed, cancelled)
- transaction_hash: TEXT
- wallet_address: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### `bounty_applications` table
```sql
- id: UUID (primary key)
- bounty_id: UUID (references bounties)
- hunter_id: UUID (references auth.users)
- stake_amount: TEXT (stake in wei)
- stake_amount_strk: DECIMAL (stake in STRK for display)
- status: TEXT (pending, approved, rejected, completed)
- transaction_hash: TEXT
- wallet_address: TEXT
- applied_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Smart Contract Integration

### Contract Details
- **Address**: `0x01157909e6562b292ec4c25ac744b6a6c2ad41bbb12c760a93e315ae32ca6b53`
- **Network**: Starknet Sepolia Testnet
- **Token**: STRK (`0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d`)

### Key Functions
1. **`create_bounty`**: Creates a new bounty on-chain
2. **`apply_to_bounty`**: Applies to a bounty with stake
3. **`get_bounty`**: Retrieves bounty details

### Transaction Flow
1. **Create Bounty**:
   - Approve STRK tokens for bounty contract
   - Call `create_bounty` with parameters
   - Store result in database

2. **Apply to Bounty**:
   - Approve STRK tokens for stake amount
   - Call `apply_to_bounty` with bounty ID and stake
   - Store application in database

## Screen Architecture

### 🏠 Navigation Structure
```
App.tsx
├── BountiesListScreen (Browse available bounties)
├── BountyDetailsScreen (View/Apply to specific bounty)
├── CreateBountyScreen (Create new bounty)
├── TasksScreen (My tasks with browse button)
└── DebugScreen (Development tools)
```

### 📱 Screen Details

#### BountiesListScreen
- **Purpose**: Display all available bounties
- **Features**:
  - Bounty cards with amount, deadline, status
  - Pull-to-refresh functionality
  - Time remaining calculations
  - Creator wallet display
  - Navigation to details

#### BountyDetailsScreen
- **Purpose**: Detailed bounty view and application
- **Features**:
  - Full bounty information
  - Application modal with stake input
  - Applications list
  - Status management (can apply, already applied, owner)
  - Smart error handling

#### CreateBountyScreen (Enhanced)
- **Purpose**: Create bounties with blockchain integration
- **New Features**:
  - Database storage after on-chain creation
  - Transaction hash tracking
  - Better error messages for insufficient balance

## Utility Functions

### `bountyContract.ts`
- **`createBountyOnChain`**: Complete bounty creation flow
- **`applyToBountyOnChain`**: Complete application flow
- **`checkStrkBalance`**: Check wallet STRK balance
- **Parameter conversion functions** for Cairo types

### `supabase.ts`
- **`createBounty`**: Store bounty in database
- **`getBounties`**: Retrieve bounties with filtering
- **`createBountyApplication`**: Store application
- **`getBountyApplications`**: Get applications for bounty

### `walletDebug.ts`
- **`extractPrivateKey`**: Safely extract private key from wallet data
- **Wallet validation** and debugging utilities

## Error Handling

### Common Errors & Solutions

1. **"Insufficient STRK balance"**
   - **Cause**: Not enough STRK tokens for transaction
   - **Solution**: Direct user to Sepolia faucets
   - **UI**: Helpful error message with faucet links

2. **"No wallet found"**
   - **Cause**: User wallet not created during signup
   - **Solution**: Retry wallet creation or contact support

3. **"Could not extract private key"**
   - **Cause**: Wallet data corruption or format change
   - **Solution**: Debug wallet data structure

## Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_SUPABASE_SERVICE_KEY=your_service_key
EXPO_PUBLIC_CAVOS_API_KEY=your_cavos_api_key
```

## Testing & Debugging

### Debug Tools
- **Balance checker**: Check STRK balance for any wallet
- **Wallet debugger**: Inspect wallet data structure
- **Database tester**: Test Supabase connections
- **Transaction tracker**: Monitor on-chain transactions

### Testing Flow
1. **Create Account**: Sign up and verify wallet creation
2. **Get STRK**: Use Sepolia faucets to get test tokens
3. **Create Bounty**: Test full bounty creation flow
4. **Apply to Bounty**: Test application process
5. **Check Database**: Verify data storage

## Future Enhancements

### Planned Features
1. **Bounty completion**: Mark bounties as completed
2. **Rating system**: Rate bounty creators and hunters
3. **Escrow system**: Hold funds until completion
4. **Notification system**: Real-time updates
5. **Photo verification**: Upload proof of completion

### Technical Improvements
1. **Event listening**: Listen for smart contract events
2. **Real bounty IDs**: Extract actual bounty IDs from events
3. **Gas optimization**: Optimize transaction costs
4. **Batch operations**: Multiple operations in one transaction

## Security Considerations

### Current Implementation
- **Private keys** stored encrypted in Supabase
- **RLS policies** protect user data
- **Service role** for admin operations
- **Input validation** on all user inputs

### Best Practices
- Never expose private keys in logs
- Validate all smart contract interactions
- Use minimum required permissions
- Regular security audits

## Support & Troubleshooting

### Common Issues
1. **Transactions failing**: Check STRK balance and network status
2. **App crashes**: Check environment variables and dependencies
3. **Database errors**: Verify Supabase configuration and RLS policies

### Getting Help
- Check logs for detailed error messages
- Use Debug Screen for wallet and balance information
- Verify smart contract address and network
- Ensure all environment variables are set correctly 