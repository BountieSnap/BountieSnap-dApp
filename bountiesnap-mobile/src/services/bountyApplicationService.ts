import { supabase } from '../utils/supabase';
import { applyToBountyOnChain } from '../utils/bountyContractFixed'; // USING FIXED VERSION

export interface ApplyToBountyParams {
  bountyId: string; // Database ID
  stakeAmount: number; // Amount in STRK
  userAddress: string;
  userPrivateKey: string;
  userId: string;
}

export interface BountyApplicationResult {
  success: boolean;
  applicationId?: string;
  transactionHash?: string;
  error?: string;
}

export async function applyToBountyWithId(params: ApplyToBountyParams): Promise<BountyApplicationResult> {
  const { bountyId, stakeAmount, userAddress, userPrivateKey, userId } = params;

  try {
    // Step 1: Get bounty details from database
    console.log('📋 Step 1: Fetching bounty details...');
    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', bountyId)
      .single();

    if (bountyError || !bounty) {
      throw new Error('Bounty not found');
    }

    if (bounty.status !== 'open') {
      throw new Error('Bounty is not available for applications');
    }

    if (bounty.creator_id === userId) {
      throw new Error('Cannot apply to your own bounty');
    }

    console.log('✅ Bounty found:', {
      title: bounty.title,
      on_chain_id: bounty.on_chain_id,
      transaction_hash: bounty.transaction_hash,
      status: bounty.status
    });

    // Validate the bounty has a proper on-chain ID
    if (!bounty.on_chain_id || bounty.on_chain_id === 'pending') {
      throw new Error('Bounty is still being processed on blockchain. Please wait a moment and try again.');
    }

    // Step 2: Check if user already applied
    const { data: existingApplication } = await supabase
      .from('bounty_applications')
      .select('id')
      .eq('bounty_id', bountyId)
      .eq('hunter_id', userId)
      .single();

    if (existingApplication) {
      throw new Error('You have already applied to this bounty');
    }

    // Step 3: Convert stake amount to wei
    const stakeAmountWei = (stakeAmount * Math.pow(10, 18)).toString();

    console.log('💰 Application details:', {
      bountyOnChainId: bounty.on_chain_id,
      stakeAmount: stakeAmount + ' STRK',
      stakeAmountWei,
      userAddress: userAddress.substring(0, 10) + '...'
    });

    // Step 4: Create application record in database (pending state)
    console.log('💾 Step 2: Creating application record...');
    const applicationRecord = {
      bounty_id: bountyId,
      hunter_id: userId,
      stake_amount: stakeAmountWei,
      stake_amount_strk: stakeAmount,
      status: 'pending',
      wallet_address: userAddress,
      transaction_hash: null // Will be updated after blockchain transaction
    };

    const { data: createdApplication, error: applicationError } = await supabase
      .from('bounty_applications')
      .insert([applicationRecord])
      .select()
      .single();

    if (applicationError) {
      console.error('❌ Application creation error:', applicationError);
      throw new Error(`Failed to create application: ${applicationError.message}`);
    }

    console.log('✅ Application record created:', createdApplication.id);

    // Step 5: Apply to bounty on blockchain
    console.log('⛓️ Step 3: Applying to bounty on blockchain...');
    console.log('🔍 Using bounty on-chain ID:', bounty.on_chain_id);
    
    try {
      const blockchainResult = await applyToBountyOnChain(
        bounty.on_chain_id, // Use the stored on-chain ID (should be 0x1, 0x2, etc.)
        stakeAmountWei,
        userAddress,
        userPrivateKey
      );

      const transactionHash = blockchainResult.applyTransaction?.result?.transactionHash;
      
      if (!transactionHash) {
        throw new Error('No transaction hash returned from blockchain application');
      }

      console.log('✅ Blockchain application successful:', transactionHash);

      // Step 6: Update application record with transaction hash
      console.log('📝 Step 4: Updating application with transaction details...');
      
      const { data: updatedApplication, error: updateError } = await supabase
        .from('bounty_applications')
        .update({
          transaction_hash: transactionHash,
          status: 'pending' // Keep as pending until bounty seeker approves
        })
        .eq('id', createdApplication.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating application with transaction hash:', updateError);
      }

      console.log('🎉 Bounty application completed successfully!');

      return {
        success: true,
        applicationId: createdApplication.id,
        transactionHash
      };

    } catch (blockchainError) {
      console.error('❌ Blockchain application failed:', blockchainError);
      
      // Provide detailed error information
      let errorMessage = 'Blockchain application failed';
      if (blockchainError instanceof Error) {
        if (blockchainError.message.includes('Bounty does not exist')) {
          errorMessage = `Bounty not found on blockchain. The bounty ID "${bounty.on_chain_id}" might be incorrect. This could happen if the bounty creation hasn't been fully processed yet.`;
        } else if (blockchainError.message.includes('Insufficient STRK')) {
          errorMessage = 'Insufficient STRK balance or allowance. Please ensure you have enough STRK tokens for the stake amount.';
        } else if (blockchainError.message.includes('argent/multicall-failed')) {
          errorMessage = 'Transaction failed. This could be due to insufficient balance, invalid bounty ID, or contract execution error.';
        } else {
          errorMessage = `Blockchain error: ${blockchainError.message}`;
        }
      }
      
      // Delete the application record since blockchain transaction failed
      await supabase
        .from('bounty_applications')
        .delete()
        .eq('id', createdApplication.id);
      
      throw new Error(errorMessage);
    }

  } catch (error) {
    console.error('❌ Bounty application failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function getUserApplications(userId: string) {
  const { data, error } = await supabase
    .from('bounty_applications')
    .select(`
      *,
      bounties (
        id,
        title,
        description,
        amount_strk,
        status,
        deadline
      )
    `)
    .eq('hunter_id', userId)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching user applications:', error);
    throw error;
  }

  return data;
} 