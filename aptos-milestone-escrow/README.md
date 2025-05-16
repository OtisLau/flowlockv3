# Aptos Milestone Escrow

A decentralized escrow platform built on the Aptos blockchain that enables milestone-based payments for freelance work.

## Features

- **Client-Freelancer System**: Connect clients with freelancers securely
- **Milestone-Based Payments**: Break down projects into milestones with individual payments
- **Secure Fund Management**: All funds are locked in smart contracts until work is approved
- **Dispute Resolution**: Built-in mechanisms for dispute handling
- **Transaction History**: Track all payments and project status

## Project Structure

```
aptos-milestone-escrow/
├── move/              # Smart contracts
│   ├── sources/       # Contract source code
│   └── Move.toml      # Move package configuration
└── frontend/          # React frontend application
    └── src/           # Frontend source code
```

## Smart Contract (Move)

The main smart contract enables:
- Creating escrow with multiple milestones
- Accepting jobs as a freelancer
- Completing milestones with partial payments
- Cancellation and dispute handling

## Getting Started

### Prerequisites

- Aptos CLI
- Node.js and npm/yarn
- Aptos wallet (Petra or Martian)

### Deploying the contract

1. Navigate to the `move` directory:
   ```
   cd aptos-milestone-escrow/move
   ```

2. Compile the contract:
   ```
   aptos move compile
   ```

3. Configure your profile (if not already done):
   ```
   aptos init
   ```

4. Publish the contract to testnet:
   ```
   aptos move publish --named-addresses milestone_escrow=<YOUR_ADDRESS>
   ```

### Running the frontend

1. Navigate to the frontend directory:
   ```
   cd aptos-milestone-escrow/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Connect your wallet and start using the application!

## How It Works

1. **Client**: Creates an escrow with project details and defined milestones
2. **Freelancer**: Accepts the job and starts working on milestones
3. **Client**: Reviews completed milestones and approves payments
4. **Smart Contract**: Automatically releases funds as milestones are approved
5. **Both Parties**: Can raise disputes if needed

## For Hackathon Demo

This MVP is designed to demonstrate the core functionality of a blockchain-powered escrow system with milestone-based payments. It showcases:

- Integration with Aptos blockchain
- Smart contract security for fund management
- Modern frontend with wallet connectivity
- Full milestone payment cycle 