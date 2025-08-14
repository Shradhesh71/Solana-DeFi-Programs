# Solana DeFi Programs

A collection of decentralized finance (DeFi) programs built on the Solana blockchain using the Anchor framework. This repository contains production-ready smart contracts for various DeFi primitives.

## 🚀 Programs Overview

### 📈 AMM (Automated Market Maker)
A robust AMM implementation supporting both SPL Token and Token-2022 standards.

**Features:**
- Dual token standard support (SPL Token & Token-2022)
- Constant product formula (x * y = k)
- Configurable fee rates
- Liquidity provider rewards
- Slippage protection

**Instructions:**
- `initialize_pool` - Create new trading pools
- `add_liquidity` - Provide liquidity and earn fees
- `remove_liquidity` - Withdraw liquidity and rewards
- `swap` - Trade tokens with minimal slippage

### 💰 Anchor Vault
A secure vault system for SOL deposits and withdrawals with PDA-based ownership.

**Features:**
- Secure SOL storage using PDAs
- User-specific vault isolation
- Rent-exempt validation
- Error handling for edge cases

**Instructions:**
- `deposit` - Securely deposit SOL into personal vault
- `withdraw` - Withdraw SOL from personal vault

### 🤝 Anchor Escrow
A trustless escrow system for secure peer-to-peer token exchanges.

**Features:**
- Trustless token swaps
- Escrow state management
- Automated settlement
- Refund mechanisms

**Instructions:**
- `make` - Create new escrow agreement
- `take` - Accept and complete escrow
- `refund` - Cancel and refund escrow

## 🛠️ Technology Stack

- **Blockchain:** Solana
- **Framework:** Anchor 0.31.1
- **Language:** Rust
- **Testing:** TypeScript with Mocha/Chai
- **Token Standards:** SPL Token, Token-2022

## 📋 Prerequisites

- Rust 1.70+
- Solana CLI 1.18+
- Anchor CLI 0.31+
- Node.js 18+
- Yarn or npm

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/Shradhesh71/Solana-DeFi-Programs.git
cd Solana-DeFi-Programs

# Install Anchor dependencies
anchor build

# Install Node.js dependencies for testing
npm install
```

## 🧪 Testing

Each program includes comprehensive test suites covering happy paths, edge cases, and error scenarios.

```bash
# Test all programs
anchor test

# Test specific program
cd anchor_vault && anchor test
cd anchor-AMM/anchor && anchor test
cd anchor_escrow && anchor test
```

## 🏗️ Project Structure

```
Solana-DeFi-Programs/
├── anchor-AMM/           # AMM Program
│   ├── anchor/
│   │   ├── programs/amm/
│   │   └── tests/
├── anchor_vault/         # Vault Program
│   ├── programs/
│   └── tests/
├── anchor_escrow/        # Escrow Program
│   ├── programs/
│   └── tests/
└── governance/           # Governance utilities
```

## 🚀 Deployment

Programs are deployed on Solana Devnet for testing:

- **AMM Program:** `FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS`
- **Vault Program:** Available in program artifacts
- **Escrow Program:** Available in program artifacts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contact

**Shradhesh** - [@Shradhesh71](https://github.com/Shradhesh71)

Project Link: [https://github.com/Shradhesh71/Solana-DeFi-Programs](https://github.com/Shradhesh71/Solana-DeFi-Programs)