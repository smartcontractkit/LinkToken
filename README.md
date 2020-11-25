# LINK Token Contracts [![Build Status](https://travis-ci.org/smartcontractkit/LinkToken.svg?branch=master)](https://travis-ci.org/smartcontractkit/LinkToken)

The LINK token is an [EIP20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20-token-standard.md) token with additional [ERC677](https://github.com/ethereum/EIPs/issues/677) functionality.

The total supply of the token is 1,000,000,000, and each token is divisible up to 18 decimal places.

To prevent accidental burns, the token does not allow transfers to the contract itself and to 0x0.

Security audit for [v0.4 version of the contracts](./contracts/v0.4/) is available [here](https://gist.github.com/Arachnid/4aa88041bd6e34835b8c0fd051245e79).

## Details

- Deployments:
  - Ethereum Mainnet [LinkToken v0.4](./flat/v0.4/LinkToken.sol): [0x514910771AF9Ca656af840dff83E8264EcF986CA](https://etherscan.io/address/0x514910771af9ca656af840dff83e8264ecf986ca)
- Decimals: 18
- Name: ChainLink Token
- Symbol: LINK

## Installation

The project contains [v0.4 contracts](./contracts/v0.4/) that were used for LINK Ethereum Mainnet deployment in 2017. For deployments moving forward, we use the updated [v0.7 contracts](./contracts/v0.7/) which use a more recent version of solc and the OpenZeppelin token standards. These updates include a minor ABI change around approval/allowance naming.

```bash
yarn install
```

## Testing

Setup contracts:

```bash
yarn setup
```

Compile the contracts:

```bash
yarn compile
```

Run tests:

```bash
yarn test
```

This will test both v0.4 and v0.7 versions of the contracts.

## Testing OVM

The Optimistic Virtual Machine (OVM) is a scalable form of the EVM. Optimistic Rollup, by [Optimism](https://optimism.io), is the core scaling solution which enables the off-chain OVM to achieve cheap, instant transactions that still inherit L1 security. The OVM is an EVM-based VM which supports optimistically executing EVM smart contracts on a layer 1 blockchain like Ethereum. It is structured in such a way that it is possible to verify individual steps of its computation on Ethereum mainnet. This allows the mainnet to enforce validity of state roots with fraud proofs in the layer 2 Optimistic Rollup chain. For more information consult the [Optimism developer documentation](https://docs.optimism.io/).

To compile and test the contracts on OVM please follow the steps below.

Setup contracts:

```bash
yarn setup:ovm
```

Run tests:

```bash
yarn test:ovm
```

This will test v0.7 version of the contracts on OVM (v0.4 not supported).
