# Aptos Milestone Escrow

A decentralized escrow platform built on the Aptos blockchain that enables milestone-based payments for freelance work. This platform provides a secure and transparent way for clients and freelancers to collaborate on projects with guaranteed payments.

## Features

- **Client-Freelancer System**: Connect clients with freelancers securely through blockchain-based smart contracts
- **Milestone-Based Payments**: Break down projects into manageable milestones with individual payments
- **Secure Fund Management**: All funds are locked in smart contracts until work is approved
- **Dispute Resolution**: Built-in mechanisms for handling disputes between parties
- **Real-time Status Tracking**: Monitor project and milestone progress in real-time
- **Wallet Integration**: Seamless integration with Aptos wallets (Petra, Martian)

## Project Structure

```
aptos-milestone-escrow/
├── move/              # Smart contracts
│   ├── sources/       # Contract source code
│   │   └── milestone_escrow.move  # Main contract file
│   └── Move.toml      # Move package configuration
└── frontend/          # React frontend application
    ├── src/           # Frontend source code
    │   ├── components/    # React components
    │   ├── utils/         # Utility functions
    │   └── App.js         # Main application component
    └── package.json   # Frontend dependencies
```

## Smart Contract Features

The main smart contract (`milestone_escrow.move`) provides the following functionality:

- **Escrow Creation**: Create new escrows with multiple milestones
- **Job Acceptance**: Freelancers can accept available jobs
- **Milestone Management**: Track and complete project milestones
- **Payment Processing**: Automatic payment release upon milestone approval
- **Dispute Handling**: Mechanisms for raising and resolving disputes
- **Cancellation**: Options for cancelling escrows under specific conditions

## Getting Started

### Prerequisites

- [Aptos CLI](https://aptos.dev/tools/aptos-cli/install-cli/)
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Petra Wallet](https://petra.app/) or [Martian Wallet](https://martianwallet.xyz/)

### Deploying the Contract

1. Navigate to the `move` directory:
   ```bash
   cd aptos-milestone-escrow/move
   ```

2. Compile the contract:
   ```bash
   aptos move compile
   ```

3. Configure your profile (if not already done):
   ```bash
   aptos init
   ```

4. Publish the contract to testnet:
   ```bash
   aptos move publish --named-addresses milestone_escrow=<YOUR_ADDRESS>
   ```

### Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd aptos-milestone-escrow/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser
5. Connect your Aptos wallet
6. Start using the application!

## How It Works

### For Clients

1. Create a new escrow with project details
2. Define milestones with descriptions and payment amounts
3. Fund the escrow with the total amount
4. Review and approve completed milestones
5. Release payments as milestones are completed

### For Freelancers

1. Browse available projects
2. Accept projects that match your skills
3. Work on and complete milestones
4. Receive payments automatically upon client approval
5. Raise disputes if needed

## Development

### Smart Contract Development

The Move smart contract is located in `move/sources/milestone_escrow.move`. Key features include:

- Escrow state management
- Milestone tracking
- Payment processing
- Event emission for frontend updates

### Frontend Development

The React frontend is built with:

- React 18
- Ant Design for UI components
- Aptos wallet adapter for blockchain interaction
- React Router for navigation

## Security Considerations

- All funds are locked in smart contracts
- Payments are only released upon milestone approval
- Dispute mechanisms are in place for conflict resolution
- Smart contract includes various safety checks and validations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 