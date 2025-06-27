// Utility functions to debug wallet data and find the correct private key
export function debugWalletData(walletData: any) {
  console.log('=== WALLET DATA DEBUG ===')
  console.log('Full wallet object:', JSON.stringify(walletData, null, 2))
  
  if (walletData?.wallet_data) {
    console.log('wallet_data object:', JSON.stringify(walletData.wallet_data, null, 2))
    console.log('wallet_data keys:', Object.keys(walletData.wallet_data))
    
    // Look for common private key field names
    const commonPkFields = ['private_key', 'privateKey', 'pk', 'hashedPk', 'hashed_pk', 'secret', 'key']
    for (const field of commonPkFields) {
      if (walletData.wallet_data[field]) {
        console.log(`Found potential private key in field '${field}':`, walletData.wallet_data[field])
      }
    }
  }
  
  console.log('wallet_address:', walletData?.wallet_address)
  console.log('=== END WALLET DEBUG ===')
}

export function extractPrivateKey(walletData: any): string | null {
  if (!walletData?.wallet_data) {
    console.error('No wallet_data found in wallet object')
    return null
  }

  // Try different common field names for private key
  const commonPkFields = [
    'private_key',
    'privateKey', 
    'pk',
    'hashedPk',
    'hashed_pk',
    'secret',
    'key'
  ]

  for (const field of commonPkFields) {
    if (walletData.wallet_data[field]) {
      console.log(`Using private key from field: ${field}`)
      return walletData.wallet_data[field]
    }
  }

  console.error('No private key found in wallet data. Available fields:', Object.keys(walletData.wallet_data))
  return null
}

export function validateWalletForTransaction(walletData: any): { isValid: boolean, error?: string } {
  if (!walletData) {
    return { isValid: false, error: 'No wallet data provided' }
  }

  if (!walletData.wallet_address) {
    return { isValid: false, error: 'No wallet address found' }
  }

  if (!walletData.wallet_data) {
    return { isValid: false, error: 'No wallet_data object found' }
  }

  const privateKey = extractPrivateKey(walletData)
  if (!privateKey) {
    return { isValid: false, error: 'No private key found in wallet data' }
  }

  return { isValid: true }
} 