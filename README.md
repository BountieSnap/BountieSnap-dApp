# 📸 BountieSnap

> Hyperlocal bounty hunting platform where neighbors help neighbors, powered by Starknet

## 🎯 What is BountieSnap?

BountieSnap connects neighbors through crypto-powered micro-tasks. Need groceries? Dog walking? Quick delivery? Post a bounty, get help instantly. Hunters earn tokens + achievement NFTs. Hyperlocal, gamified, zero bureaucracy.



https://github.com/user-attachments/assets/e6799007-f6b4-4422-8fbc-1cdc9eed457d



**"From neighbor to neighbor, one snap at a time"** 🏘️

## ✨ Key Features

- 🗺️ **Hyperlocal Bounties**: Find tasks within 2km radius
- 💰 **Instant Crypto Payments**: Get paid immediately upon completion
- 🏆 **Achievement NFTs**: Collect rare badges for completed tasks
- 📸 **Snap Verification**: Photo proof of task completion
- 🎮 **Gamified Experience**: Level up your neighborhood reputation
- 🔒 **Zero Bureaucracy**: No lengthy onboarding or KYC

## 🚀 Live Demo

- **Web App**: [bountiesnap.vercel.app](https://bountiesnap.vercel.app)
- **Demo Video**: [Watch Demo](https://youtube.com/watch?v=demo)
- **Starknet Contract**: [View on Testnet](https://testnet.starkscan.co/contract/0x...)

![image](https://github.com/user-attachments/assets/22f97cf6-525e-48ef-9702-5d4a96eba08f)
![image](https://github.com/user-attachments/assets/cd6cfb57-b910-4d4b-8f42-d40b8eb2f37f)
![image](https://github.com/user-attachments/assets/f0f3960e-6b72-41a1-accf-231a31a71966)
![image](https://github.com/user-attachments/assets/0d54ace8-6491-487e-828a-9156e8ebaf23)


## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Smart Contract │    │   IPFS/Storage  │
│   (React + Map) │◄──►│     (Cairo)     │◄──►│  (NFT Metadata) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   Starknet      │◄─────────────┘
                        │   (Sepolia)     │
                        └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: Starknet React + Argent X
- **Build**: React Native Expo

### Smart Contracts
- **Language**: Cairo 2.4.0
- **Framework**: Starknet Foundry
- **Network**: Starknet Sepolia
- **Standards**: ERC-721 (NFTs), ERC-20 (Tokens)
- **Cavos**: Wallet deploy

### Development Tools
- **AI Coding**: Cursor IDE + Cairo Coder
- **Frontend**: bolt.new for rapid prototyping
- **Version Control**: Git + GitHub

## 📦 Project Structure

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- Starkli CLI
- Cairo 2.4.0
- Argent X or Braavos wallet

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/bountiesnap.git
cd bountiesnap
```

### 2. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Contracts
cd ../contracts
scarb build
```

### 3. Deploy Contracts (Testnet)
```bash
cd contracts
starkli declare target/dev/bountiesnap_BountyContract.contract_class.json
starkli deploy [CLASS_HASH] [CONSTRUCTOR_ARGS]
```

### 4. Configure Frontend
```bash
cd frontend
cp .env.example .env.local
# Add your contract address and Mapbox API key
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see BountieSnap in action!

## 🎮 How to Use

### For Seekers (Need Help)
1. **Connect Wallet** - Link your Starknet wallet
2. **Create Bounty** - Describe task, set location, define reward
3. **Wait for Hunter** - Review hunter profiles and ratings
4. **Confirm Completion** - Verify task completion and release payment

### For Hunters (Earn Rewards)
1. **Explore Map** - Browse nearby bounties by category
2. **Accept Task** - Stake small deposit to show commitment
3. **Complete & Snap** - Finish task and upload proof photo
4. **Get Paid** - Receive tokens + achievement NFT instantly

## 🏆 Achievement System

| NFT Badge | Requirement | Rarity |
|-----------|-------------|---------|
| 🚗 Speed Demon | Complete 10 tasks under 30min | Common |
| 🛒 Shopping Pro | 25 perfect shopping trips | Uncommon |
| 🐕 Pet Whisperer | Walk 50 dogs | Rare |
| ⭐ Five Star Hunter | Maintain 5.0 rating for 30 days | Epic |
| 🌟 Local Hero | Help 100+ neighbors | Legendary |

## 📱 Mobile Support

BountieSnap is mobile-first and works perfectly on:
- iOS Safari (PWA ready)
- Android Chrome
- All modern mobile browsers

## 🚀 Deployment

### Testnet
- Frontend: Automatically deployed via Vercel on push
- Contracts: Deployed to Starknet Testnet

### Mainnet (Coming Soon)
- Smart contracts will be audited before mainnet deployment
- Multi-sig wallet for contract upgrades

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Built for [Starknet Vibathon 2025](https://starkware.co/vibathon)
- Powered by Cairo smart contracts
- Maps by Mapbox
- Icons by Lucide React

## 📞 Connect With Us

- **Telegram**: [BountieSnap Community](https://t.me/bountiesnap)
- **Twitter**: [@BountieSnap](https://twitter.com/bountiesnap)
- **Email**: hello@bountiesnap.xyz

---

**Made with ❤️ for the neighborhood**

*BountieSnap - Rebuilding communities, one bounty at a time* 🏘️✨
