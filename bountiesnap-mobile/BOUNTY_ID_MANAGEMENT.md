# Bounty ID Management System

This document explains the new bounty ID management system implemented to provide better control over bounty creation and application processes.

## Overview

The system now uses a managed ID approach where:
1. **Unique IDs are generated** before any blockchain interaction
2. **Database records are created first** to ensure data consistency
3. **On-chain transactions use the pre-generated IDs** for better control
4. **Applications reference the correct bounty IDs** stored in the database

## Key Components

### 1. ID Generation (`src/utils/bountyId.ts`)

```typescript
// Generate a unique numeric bounty ID
const onChainId = generateNumericBountyId();

// Validate bounty ID format
const isValid = isValidBountyId(onChainId);
```

**Functions:**
- `generateNumericBountyId()`: Creates timestamp + random based numeric IDs
- `generateUniqueBountyId()`: Creates string-based felt252 IDs
- `uuidToFelt252()`: Converts database UUIDs to felt252 format
- `isValidBountyId()`: Validates ID formats

### 2. Bounty Creation Service (`src/services/bountyService.ts`)

The new service handles the complete bounty creation workflow:

```typescript
const result = await createBountyWithManagedId({
  title: "Fix my laptop",
  description: "Screen replacement needed",
  category: "maintenance",
  payment: 50, // STRK amount
  deadline: deadlineTimestamp,
  userAddress: "0x...",
  userPrivateKey: "0x...",
  userId: "user-uuid"
});
```

**Process Flow:**
1. 🆔 Generate unique bounty ID
2. 💾 Create database record with `status: 'pending'`
3. ⛓️ Create bounty on blockchain using the generated ID
4. 📝 Update database record with transaction hash and `status: 'open'`
5. 🎉 Return success with all details

### 3. Bounty Application Service (`src/services/bountyApplicationService.ts`)

Handles bounty applications using the proper on-chain IDs:

```typescript
const result = await applyToBountyWithId({
  bountyId: "database-uuid", // Database bounty ID
  stakeAmount: 10, // STRK amount
  userAddress: "0x...",
  userPrivateKey: "0x...",
  userId: "user-uuid"
});
```

**Process Flow:**
1. 📋 Fetch bounty details from database (including `on_chain_id`)
2. ✅ Validate bounty status and user eligibility
3. 💾 Create application record with `status: 'pending'`
4. ⛓️ Apply to bounty on blockchain using `bounty.on_chain_id`
5. 📝 Update application with transaction hash
6. 🎉 Return success with application details

### 4. Updated Contract Interface (`src/utils/bountyContract.ts`)

The `CreateBountyParams` interface now includes `bounty_id`:

```typescript
export interface CreateBountyParams {
  bounty_id: string // Unique bounty ID for on-chain reference
  description: string
  amount: string // Amount in wei
  deadline: number // Unix timestamp
  userAddress: string
  userPrivateKey: string
}
```

The contract call now passes the ID as the first parameter:
```typescript
calldata: [
  bounty_id,       // bounty_id as felt252 (first parameter)
  descriptionFelt, // description as felt252
  amountLow,       // amount low
  amountHigh,      // amount high
  deadlineU64      // deadline as u64
]
```

## Database Schema Updates

### Bounty Status Constraint
The bounties table now supports a `'pending'` status:

```sql
ALTER TABLE public.bounties 
ADD CONSTRAINT bounties_status_check 
CHECK (status IN ('pending', 'open', 'accepted', 'in_progress', 'completed', 'cancelled'));
```

### Key Fields
- `on_chain_id`: Stores the blockchain bounty ID (felt252 format)
- `transaction_hash`: Stores the creation transaction hash
- `status`: Now includes 'pending' for bounties being created

## Smart Contract Integration

The Cairo contract expects bounty IDs as the first parameter:

```cairo
fn create_bounty(
    ref self: TContractState,
    bounty_id: felt252,     // ← Generated ID passed here
    description: felt252, 
    amount: u256, 
    deadline: u64
) -> felt252;
```

The contract validates that:
- `bounty_id != 0`
- `bounty_id` doesn't already exist
- Returns the same `bounty_id` on success

## Usage Examples

### Creating a Bounty

```typescript
// In CreateBountyScreen.tsx
import { createBountyWithManagedId } from '../services/bountyService';

const result = await createBountyWithManagedId({
  title: bountyData.title,
  description: bountyData.description,
  category: bountyData.category,
  payment: bountyData.payment,
  deadline: deadlineTimestamp,
  userAddress: userWallet.wallet_address,
  userPrivateKey: privateKey,
  userId: user.id
});

if (result.success) {
  console.log('Bounty created!');
  console.log('Database ID:', result.bountyId);
  console.log('On-chain ID:', result.onChainId);
  console.log('Transaction:', result.transactionHash);
}
```

### Applying to a Bounty

```typescript
// In BountyDetailsScreen.tsx (example)
import { applyToBountyWithId } from '../services/bountyApplicationService';

const result = await applyToBountyWithId({
  bountyId: bounty.id, // Database UUID
  stakeAmount: 10,
  userAddress: userWallet.wallet_address,
  userPrivateKey: privateKey,
  userId: user.id
});

if (result.success) {
  console.log('Application successful!');
  console.log('Application ID:', result.applicationId);
  console.log('Transaction:', result.transactionHash);
}
```

## Benefits

1. **Better Control**: IDs are generated and managed by the backend
2. **Consistency**: Database and blockchain stay in sync
3. **Error Handling**: Failed blockchain transactions don't leave orphaned records
4. **Traceability**: Clear relationship between database records and blockchain transactions
5. **Reliability**: System can handle partial failures gracefully

## Error Handling

The system includes comprehensive error handling:

- **Database failures**: Blockchain transactions are not attempted
- **Blockchain failures**: Database records are cleaned up
- **Validation errors**: Clear error messages for debugging
- **Rollback support**: Failed operations don't leave inconsistent state

## Migration Notes

### Existing Bounties
Existing bounties may have transaction hashes as `on_chain_id`. These will continue to work, but new bounties will use the managed ID system.

### Database Updates
Run the combined database fixes script:

```sql
-- From database-fixes.sql
-- 1. Update bounty status constraint to include 'pending'
ALTER TABLE public.bounties 
DROP CONSTRAINT IF EXISTS bounties_status_check;

ALTER TABLE public.bounties 
ADD CONSTRAINT bounties_status_check 
CHECK (status IN ('pending', 'open', 'accepted', 'in_progress', 'completed', 'cancelled'));

-- 2. Make transaction_hash nullable 
ALTER TABLE public.bounties 
ALTER COLUMN transaction_hash DROP NOT NULL;

ALTER TABLE public.bounty_applications 
ALTER COLUMN transaction_hash DROP NOT NULL;
```

**Important:** The `transaction_hash` fields are now nullable because bounties and applications are created before blockchain transactions complete.

## Testing

To test the new system:

1. **Create a bounty** and verify the ID generation
2. **Check database** for proper record creation
3. **Verify blockchain** transaction with the generated ID
4. **Apply to bounty** using the database bounty ID
5. **Confirm** the application uses the correct on-chain ID

## Troubleshooting

### Common Issues

**"Bounty ID already exists"**
- The generated ID conflicts with an existing one
- This is very rare due to timestamp + random generation
- The system will retry with a new ID

**"Bounty not found" during application**
- Database bounty ID doesn't exist
- Check that the bounty was created successfully
- Verify the bounty status is 'open'

**"Invalid bounty ID format"**
- Generated ID doesn't meet felt252 requirements
- Check ID validation logic
- Ensure IDs are properly converted to hex format

**"null value in column \"transaction_hash\" violates not-null constraint"**
- Database schema hasn't been updated with the fixes
- Run the `database-fixes.sql` script to make transaction_hash nullable
- This allows bounties to be created before blockchain transactions complete

### Debug Information

Enable detailed logging by checking console output for:
- 🆔 ID generation steps
- 💾 Database operations
- ⛓️ Blockchain transactions
- 📝 Record updates
- 🎉 Success confirmations 