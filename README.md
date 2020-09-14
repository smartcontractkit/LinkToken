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

The project is setup to work with [v0.6 contracts](./contracts/v0.6/), while the [v0.4 contracts](./contracts/v0.4/) are here to document LINK Ethereum Mainnet deployment in 2017.

```
yarn install
```

## Testing

Before running tests, open a new terminal and start Ganache on port `8454`:

```
ganache-cli -l 8000000
```

Run tests:

```
yarn test
```

This will instruct the tests to run against your locally deployed instance of Ganache.

## Migration

```
yarn migrate:development
```

This will migrate the `LinkToken` contract to your locally deployed instance of Ganache blockchain.
