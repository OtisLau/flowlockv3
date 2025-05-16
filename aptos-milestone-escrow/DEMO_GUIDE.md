# Aptos Milestone Escrow: Demo Guide

This guide will help you demonstrate the Aptos Milestone Escrow system for your hackathon presentation.

## Demo Flow

### 1. Deploy the Smart Contract

Before starting the demo, make sure you've deployed the smart contract to Aptos testnet:

```bash
cd aptos-milestone-escrow/move
aptos init  # Configure with your testnet account
aptos move compile
aptos move publish --named-addresses milestone_escrow=<YOUR_ADDRESS>
```

After deployment, update the `MODULE_ADDRESS` in `frontend/src/utils/contractUtils.js` with your deployed contract address.

### 2. Start the Frontend

```bash
cd aptos-milestone-escrow/frontend
npm install
npm start
```

### 3. Demo Script

#### Part 1: Introduction (1 minute)
- Introduce the problem: Freelance payments lack security and trust
- Explain how blockchain-based escrow solves the issue
- Highlight the milestone feature as key innovation

#### Part 2: Client Flow (2 minutes)
1. Connect wallet (Petra/Martian)
2. Navigate to "Create New Escrow"
3. Fill out project details:
   - Title: "Website Development"
   - Description: "Create a responsive e-commerce website"
4. Add multiple milestones:
   - Milestone 1: "Design mockups" - 0.5 APT
   - Milestone 2: "Frontend implementation" - 1 APT
   - Milestone 3: "Backend integration" - 1.5 APT
5. Create the escrow
6. Show the new escrow on the dashboard

#### Part 3: Freelancer Flow (2 minutes)
1. Connect with a different wallet (freelancer wallet)
2. Show "Open Opportunities" tab
3. Open the escrow created by the client
4. Accept the project
5. Show the status change to "In Progress"

#### Part 4: Milestone Completion (2 minutes)
1. Switch back to client wallet
2. Navigate to the escrow details
3. Approve a milestone completion
4. Show payment being released automatically
5. Demonstrate progress tracking

#### Part 5: Technical Highlights (1 minute)
- Highlight the smart contract architecture
- Mention security features
- Discuss blockchain benefits (transparency, immutability)

#### Part 6: Future Roadmap (1 minute)
- Dispute resolution improvements
- Reputation system
- Marketplace features
- Multi-chain support

## Key Features to Highlight

- **Milestone-based Payments**: Break down projects into smaller parts
- **Secure Fund Management**: All funds are locked in the contract
- **Automatic Payments**: Released only when work is approved
- **Transparent Process**: All parties can view status and history
- **Dispute Resolution**: Built-in mechanism for handling issues

## Demo Tips

1. Have at least two wallets ready with testnet APT
2. Pre-deploy the contract before the demo starts
3. Create a sample escrow beforehand as backup
4. Rehearse the wallet switching process
5. Keep transaction explanations brief and focused
6. Emphasize the user experience and simplicity

## Technical Requirements

- Aptos wallet extension (Petra or Martian)
- Testnet APT (from faucet)
- Modern browser
- Internet connection

## Common Questions & Answers

**Q: How do you ensure the freelancer delivers quality work?**  
A: The milestone system allows clients to verify each deliverable before releasing payment.

**Q: What happens if there's a dispute?**  
A: Either party can initiate a dispute which freezes the escrow until resolved.

**Q: How are the funds secured?**  
A: All funds are locked in the smart contract which operates based on predefined rules.

**Q: Can this be used for any type of freelance work?**  
A: Yes, the milestone system is flexible for any type of project that can be broken into deliverables. 