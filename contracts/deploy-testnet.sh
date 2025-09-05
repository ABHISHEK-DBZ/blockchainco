#!/bin/bash

# 🚀 Quick Start: Deploy Blue Carbon Registry to Testnet
# Run this script to get your blockchain layer live in 10 minutes

echo "🌊 Blue Carbon Registry - Testnet Deployment Script"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "hardhat.config.js" ]; then
    echo "❌ Please run this script from the contracts directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env template..."
    cat > .env << EOF
# Add your private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Mumbai testnet RPC URL
POLYGON_MUMBAI_RPC=https://rpc-mumbai.maticvigil.com

# Optional: Polygonscan API key for verification
POLYGONSCAN_API_KEY=your_api_key_here
EOF
    echo "📝 Please edit .env file with your credentials, then run this script again"
    exit 1
fi

# Step 3: Create deployments directory
mkdir -p deployments

# Step 4: Deploy to Mumbai testnet
echo "🚀 Deploying contracts to Mumbai testnet..."
npx hardhat run scripts/deploy.js --network polygonMumbai

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🎉 Your Blue Carbon Registry is now live on blockchain!"
    echo ""
    echo "Next steps:"
    echo "1. Check deployments/polygonMumbai.json for contract addresses"
    echo "2. Add these addresses to your frontend configuration"
    echo "3. Test the contracts with the frontend interface"
    echo ""
    echo "🔗 View your contracts on: https://mumbai.polygonscan.com/"
else
    echo "❌ Deployment failed. Please check your .env configuration and try again."
fi
