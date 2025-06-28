#!/bin/bash

# Deployment script for BountyContract on Starknet Sepolia testnet
echo "🚀 Deploying BountyContract to Starknet Sepolia testnet..."

# Configuration
KEYSTORE_PATH="$HOME/.starkli-wallets/testnet-key.json"
ACCOUNT_PATH="$HOME/.starkli-wallets/testnet-account.json"
CONTRACT_CLASS="target/dev/contracts_BountyContract.contract_class.json"
NETWORK="sepolia"
STARKLI="sudo /root/.starkli/bin/starkli"

echo "📋 Account Address: 0x05cb6a701e15979109f8de556f543383178ec5031832ae02d5cd85a2c8479ff1"
echo "📋 Public Key: 0x008037db4b68fc151d64e6e6b7c1baf10c8d01c902fdaeca2bc6ec47bfee0463"
echo ""
echo "⚠️  IMPORTANT: Make sure to fund your account with testnet ETH first!"
echo "   Faucet: https://starknet-faucet.vercel.app/"
echo ""

# Step 1: Build the contract
echo "🔨 Building contract..."
scarb build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Step 2: Deploy account (if not already deployed)
echo "🏗️  Deploying account..."
$STARKLI account deploy $ACCOUNT_PATH --keystore $KEYSTORE_PATH --network $NETWORK

# Step 3: Declare the contract class
echo "📋 Declaring contract class..."
CLASS_HASH=$($STARKLI declare $CONTRACT_CLASS --account $ACCOUNT_PATH --keystore $KEYSTORE_PATH --network $NETWORK | grep "Class hash" | cut -d' ' -f3)

if [ -z "$CLASS_HASH" ]; then
    echo "❌ Failed to declare contract class!"
    exit 1
fi

echo "✅ Contract class declared with hash: $CLASS_HASH"

# Step 4: Deploy the contract
echo "🚀 Deploying contract instance..."
CONTRACT_ADDRESS=$($STARKLI deploy $CLASS_HASH --account $ACCOUNT_PATH --keystore $KEYSTORE_PATH --network $NETWORK | grep "Contract deployed" | cut -d' ' -f3)

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Failed to deploy contract!"
    exit 1
fi

echo ""
echo "🎉 SUCCESS! BountyContract deployed!"
echo "📋 Contract Address: $CONTRACT_ADDRESS"
echo "📋 Class Hash: $CLASS_HASH"
echo "📋 Network: Starknet Sepolia testnet"
echo ""
echo "🔗 View on Starkscan: https://sepolia.starkscan.co/contract/$CONTRACT_ADDRESS"
echo ""
echo "🎯 Your bounty contract is now live on testnet!"

# Save deployment info
echo "Saving deployment info..."
cat > deployment-info.json << EOF
{
  "contract_address": "$CONTRACT_ADDRESS",
  "class_hash": "$CLASS_HASH",
  "network": "$NETWORK",
  "account_address": "0x05cb6a701e15979109f8de556f543383178ec5031832ae02d5cd85a2c8479ff1",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ Deployment info saved to deployment-info.json" 