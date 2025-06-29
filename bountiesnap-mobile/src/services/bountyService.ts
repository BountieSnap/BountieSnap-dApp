import { supabase } from '../utils/supabase';
import { createBountyOnChain } from '../utils/bountyContractFixed'; // USING FIXED VERSION
import { generateNumericBountyId, isValidBountyId } from '../utils/bountyId';
import { testContractInteraction, analyzeContractError } from '../utils/contractDebug';

export interface CreateBountyServiceParams {
  title: string;
  description: string;
  category: string;
  payment: number;
  location_address?: string;
  deadline: number; // Unix timestamp
  requirements?: string[];
  userAddress: string;
  userPrivateKey: string;
  userId: string;
}

export interface BountyCreationResult {
  success: boolean;
  bountyId: string;
  onChainId: string;
  transactionHash: string;
  databaseRecord?: any;
  error?: string;
  needsManualIdExtraction?: boolean;
  voyagerUrl?: string;
}

export async function createBountyWithManagedId(params: CreateBountyServiceParams): Promise<BountyCreationResult> {
  const {
    title,
    description,
    category,
    payment,
    location_address,
    deadline,
    requirements = ['Photo proof of completion'],
    userAddress,
    userPrivateKey,
    userId
  } = params;

  try {
    console.log('🚀 Creating bounty with event-based ID extraction...');

    // Step 1: Convert payment to wei
    const amountInWei = (payment * Math.pow(10, 18)).toString();
    const amountStrk = payment;

    // Step 2: Create database record with temporary placeholder
    console.log('💾 Step 1: Creating database record...');
    
    const bountyRecord = {
      creator_id: userId,
      on_chain_id: 'pending', // Will be updated with actual ID from events
      title: title.trim(),
      description: description.trim(),
      category,
      payment,
      amount: amountInWei,
      amount_strk: amountStrk,
      location_address: location_address || null,
      deadline: new Date(deadline * 1000).toISOString(),
      wallet_address: userAddress,
      requirements,
      status: 'pending', // Set as pending until blockchain transaction succeeds
      transaction_hash: null // Will be updated after blockchain transaction
    };

    const { data: createdBounty, error: dbError } = await supabase
      .from('bounties')
      .insert([bountyRecord])
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insertion error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('✅ Database record created:', createdBounty.id);

    // Step 3: Create bounty on blockchain (OLD contract generates the ID internally)
    console.log('⛓️ Step 2: Creating bounty on blockchain...');
    console.log('🔍 Contract call parameters:', {
      description: description.substring(0, 20) + '...',
      amount: amountInWei,
      deadline,
      userAddress: userAddress.substring(0, 10) + '...'
    });
    
    // Validate parameters before sending to blockchain
    if (BigInt(amountInWei) <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (deadline <= Math.floor(Date.now() / 1000)) {
      throw new Error('Deadline must be in the future');
    }
    
    try {
      const blockchainResult = await createBountyOnChain({
        // NO bounty_id parameter - old contract generates it internally
        description,
        amount: amountInWei,
        deadline,
        userAddress,
        userPrivateKey
      });

      const transactionHash = blockchainResult.transactionHash;
      const actualBountyId = blockchainResult.actualBountyId;
      const needsManualExtraction = blockchainResult.needsManualIdExtraction;
      
      if (!transactionHash) {
        throw new Error('No transaction hash returned from blockchain');
      }

      console.log('✅ Blockchain transaction successful:', transactionHash);

      // Step 4: Handle bounty ID extraction
      let finalOnChainId = actualBountyId;
      
      if (actualBountyId) {
        console.log('🎯 Successfully extracted bounty ID from events:', actualBountyId);
        finalOnChainId = actualBountyId;
      } else if (needsManualExtraction) {
        console.log('⚠️ Could not automatically extract bounty ID from transaction');
        console.log('🔗 Please check the transaction on Voyager:');
        console.log(`   https://sepolia.voyager.online/tx/${transactionHash}`);
        console.log('📝 Look for the BountyCreated event and note the bounty_id value');
        console.log('🔧 You may need to manually update the database with:');
        console.log(`   UPDATE bounties SET on_chain_id = 'ACTUAL_ID' WHERE id = '${createdBounty.id}';`);
        
        // For now, use transaction hash as placeholder
        finalOnChainId = `MANUAL_EXTRACT_${transactionHash.slice(-8)}`;
      }

      // Step 5: Update database record with the bounty ID and transaction hash
      console.log('📝 Step 3: Updating database with transaction details...');
      
      const { data: updatedBounty, error: updateError } = await supabase
        .from('bounties')
        .update({
          on_chain_id: finalOnChainId,
          transaction_hash: transactionHash,
          status: actualBountyId ? 'open' : 'manual_id_needed' // Special status if manual extraction needed
        })
        .eq('id', createdBounty.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating bounty with transaction hash:', updateError);
        // Try to clean up the database record if update fails
        await supabase.from('bounties').delete().eq('id', createdBounty.id);
        throw new Error(`Failed to update bounty with transaction details: ${updateError.message}`);
      }

      console.log('🎉 Bounty creation completed successfully!');
      
      if (needsManualExtraction) {
        console.log('⚠️ IMPORTANT: Bounty ID needs manual extraction from blockchain explorer');
        console.log('   The bounty is created but applications will fail until the correct ID is set');
      }

      return {
        success: true,
        bountyId: createdBounty.id,
        onChainId: finalOnChainId,
        transactionHash,
        databaseRecord: updatedBounty,
        needsManualIdExtraction: needsManualExtraction,
        voyagerUrl: `https://sepolia.voyager.online/tx/${transactionHash}`
      };

    } catch (blockchainError) {
      console.error('❌ Blockchain error:', blockchainError);
      
      // Clean up database record if blockchain transaction failed
      console.log('🧹 Cleaning up database record due to blockchain failure...');
      await supabase.from('bounties').delete().eq('id', createdBounty.id);
      
      throw new Error(`Blockchain transaction failed: ${blockchainError instanceof Error ? blockchainError.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Bounty creation failed:', error);
    
    return {
      success: false,
      bountyId: '',
      onChainId: '',
      transactionHash: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function getBountyByOnChainId(onChainId: string) {
  const { data, error } = await supabase
    .from('bounties')
    .select('*')
    .eq('on_chain_id', onChainId)
    .single();

  if (error) {
    console.error('Error fetching bounty by on-chain ID:', error);
    return null;
  }

  return data;
}

export async function updateBountyStatus(bountyId: string, status: string) {
  const { data, error } = await supabase
    .from('bounties')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bountyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating bounty status:', error);
    throw error;
  }

  return data;
} 