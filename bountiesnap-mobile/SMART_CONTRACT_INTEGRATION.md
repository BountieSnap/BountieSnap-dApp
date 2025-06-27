# Smart Contract Integration for Bounty Creation

## Overview
The BountieSnap mobile app now integrates with your Starknet smart contract deployed on Sepolia testnet for creating bounties on-chain.

## Contract Details
- **Contract Address**: `0x01157909e6562b292ec4c25ac744b6a6c2ad41bbb12c760a93e315ae32ca6b53`
- **Network**: Sepolia Testnet
- **Token**: STRK (Starknet Token)

## How It Works

### 1. User Flow
1. User creates account → Wallet is automatically created via Cavos API
2. User fills out bounty form (title, description, category, payment, deadline)
3. User clicks "Create Bounty" → App interacts with smart contract
4. Two transactions are executed:
   - **Transaction 1**: Approve STRK tokens for the bounty contract
   - **Transaction 2**: Call `create_bounty` function with bounty details

### 2. Smart Contract Integration

#### Functions Used:
- `create_bounty(description: felt252, amount: u256, deadline: u64)`

#### Process:
1. **Get User Wallet**: Retrieves wallet data from Supabase database
2. **Validate Wallet**: Ensures wallet has required fields (address, private key)
3. **Convert Parameters**: 
   - Description → felt252 (encoded string)
   - Amount → u256 (payment in wei, STRK has 18 decimals)
   - Deadline → u64 (Unix timestamp)
4. **Execute Transactions**:
   - Approve STRK tokens for bounty contract
   - Create bounty on-chain
5. **Handle Response**: Show success/error messages with transaction hashes

### 3. File Structure

```
src/
├── utils/
│   ├── bountyContract.ts     # Smart contract interaction functions
│   ├── walletDebug.ts       # Wallet data debugging utilities
│   └── utils.ts             # Existing utility functions (createWallet, etc.)
├── screens/
│   └── CreateBountyScreen.tsx # Updated with blockchain integration
└── context/
    └── AuthContext.tsx      # Handles wallet creation during signup
```

## Key Features

### 1. Automatic Wallet Creation
- When users sign up, a Starknet wallet is automatically created via Cavos API
- Wallet data is securely stored in Supabase with user association

### 2. Smart Contract Functions

#### `createBountyOnChain()`
- Converts user input to Cairo-compatible format
- Handles STRK token approval
- Calls the smart contract's `create_bounty` function
- Returns transaction hashes for both operations

#### Helper Functions:
- `stringToFelt252()` - Converts strings to Cairo felt252 format
- `amountToU256()` - Converts amounts to u256 format (low, high)
- `timestampToU64()` - Converts timestamps to u64 format

### 3. Error Handling & Debugging
- Comprehensive wallet validation
- Detailed logging for debugging
- User-friendly error messages
- Automatic wallet data structure detection

### 4. UI Integration
- Loading states during transaction processing
- Real-time status updates
- Transaction hash display
- Disabled button states during processing

## Configuration

### Environment Variables Required:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_SUPABASE_SERVICE_KEY=your_service_role_key
EXPO_PUBLIC_CAVOS_API_KEY=your_cavos_api_key
```

### Database Schema:
- `user_wallets` table with wallet data and RLS policies
- Service role access for wallet creation during signup

## Usage Example

```typescript
// Creating a bounty on-chain
const result = await createBountyOnChain({
  description: "Pick up groceries from store",
  amount: "5000000000000000000", // 5 STRK in wei
  deadline: 1672531200, // Unix timestamp
  userAddress: "0x123...",
  userPrivateKey: "0x456..."
});

// Result contains:
// - approveTransaction: STRK approval transaction
// - createBountyTransaction: Bounty creation transaction
```

## Transaction Flow

1. **User Input Validation**
   - Check required fields
   - Validate user authentication
   - Ensure wallet exists

2. **Wallet Data Retrieval**
   - Get wallet from database
   - Debug wallet structure
   - Extract private key safely

3. **Parameter Conversion**
   - Convert description to felt252
   - Convert payment amount to wei (×10^18)
   - Convert deadline to Unix timestamp

4. **Blockchain Transactions**
   - Approve STRK tokens for contract
   - Create bounty with converted parameters
   - Handle transaction responses

5. **UI Updates**
   - Show loading states
   - Display transaction hashes
   - Update local state
   - Navigate back to main screen

## Error Handling

### Common Errors:
- **Wallet Not Found**: User doesn't have a wallet in database
- **Invalid Private Key**: Wallet data structure issues
- **Insufficient Tokens**: User doesn't have enough STRK
- **Network Issues**: Cavos API connection problems
- **Transaction Failed**: Smart contract execution errors

### Debug Features:
- Wallet data structure logging
- Private key field detection
- Transaction parameter validation
- Detailed error messages with context

## Security Considerations

- Private keys are stored securely in Supabase
- Service role key bypasses RLS for wallet creation
- No private keys are exposed in logs (only presence is logged)
- Wallet validation before transactions
- User authentication required for all operations

## Future Enhancements

1. **Gas Fee Estimation**: Show estimated transaction costs
2. **Transaction History**: Track all user transactions
3. **Retry Mechanism**: Handle failed transactions gracefully
4. **Balance Checking**: Verify sufficient STRK before transactions
5. **Multiple Networks**: Support mainnet deployment
6. **Advanced Features**: Implement other contract functions (apply, approve, etc.)

## Testing

Use the Debug Screen to test:
1. Environment variables
2. Database connection
3. Wallet creation
4. Smart contract interaction

The integration provides a seamless user experience while leveraging the security and transparency of blockchain technology. 