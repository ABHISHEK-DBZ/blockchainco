# 🚀 Deploy Blue Carbon Registry to Blockchain

## Quick Start (5 minutes)

### Prerequisites:
1. **MetaMask wallet** with Mumbai testnet configured
2. **Test MATIC tokens** for gas fees (get free from faucet)
3. **Private key** from your MetaMask wallet

### Step 1: Get Test MATIC
Visit: https://faucet.polygon.technology/
- Connect your MetaMask wallet
- Select "Mumbai" network  
- Request test MATIC tokens

### Step 2: Configure Environment
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env file and add your private key:
PRIVATE_KEY=your_actual_private_key_without_0x_prefix
```

### Step 3: Deploy Contracts
```bash
# Compile contracts
npx hardhat compile

# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.js --network mumbai
```

### Step 4: Verify Deployment
- Check `deployments/mumbai.json` for contract addresses
- View contracts on: https://mumbai.polygonscan.com/
- Test contracts from your frontend

## What You'll Get:
✅ **Registry Contract** - Manages participants and permissions
✅ **Project Contract** - Handles restoration projects lifecycle  
✅ **Carbon Credit Token** - ERC1155 tokens for carbon credits
✅ **Live on Mumbai Testnet** - Real blockchain functionality
✅ **Contract Verification** - Source code verified on explorer

## Next Steps After Deployment:
1. **Add contract addresses** to frontend configuration
2. **Connect MetaMask** to your React app
3. **Test token operations** through the UI
4. **Deploy to mainnet** when ready for production

---

## 💡 **Why Deploy Now?**

Your system is 95% complete - only missing the blockchain layer!
Deploying now gives you:
- **Real tokenization** of carbon credits
- **Immutable project records** 
- **Transparent verification** system
- **Complete end-to-end flow**

**Ready to make it happen?** 🌊🌿
