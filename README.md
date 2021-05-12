# LINK Token Contracts

The LINK token is an [EIP20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20-token-standard.md) token with additional [ERC677](https://github.com/ethereum/EIPs/issues/677) functionality.

The total supply of the token is 1,000,000,000, and each token is divisible up to 18 decimal places.

To prevent accidental burns, the token does not allow transfers to the contract itself and to 0x0.

Security audit for [0.4 version of the contracts](./contracts/v0.4/) is available [here](https://gist.github.com/Arachnid/4aa88041bd6e34835b8c0fd051245e79).

## Details

- Deployments:
  - Ethereum Mainnet [LinkToken 0.4](./contracts-flat/v0.4/LinkToken.sol): [0x514910771AF9Ca656af840dff83E8264EcF986CA](https://etherscan.io/address/0x514910771af9ca656af840dff83e8264ecf986ca)
- Decimals: 18
- Name: ChainLink Token
- Symbol: LINK

## Setup

The project contains [0.4 contracts](./contracts/v0.4/) that were used for LINK Ethereum Mainnet deployment in 2017. For deployments moving forward, we use the updated [0.6 contracts](./contracts/v0.6/) which use a more recent version of solc and the OpenZeppelin token standards. These updates include a minor ABI change around approval/allowance naming.

```bash
yarn install
```

Setup contracts:

```bash
yarn setup
```

This will compile all versions of the contracts.

## Testing

Run tests:

```bash
yarn test
```

This will run unit tests for all versions of the contracts.

## Integration testing

Integration tests are currently setup for Optimism contracts, and to run them make sure you have a local network running first.

The network can be started using a helpful script, which will clone the [Optimism monorepo](https://github.com/ethereum-optimism/optimism), build the :

```bash
yarn script:oe:up
```

Run tests:

```bash
yarn test --network optimism
```

This will run unit tests for all versions of the contracts, plus supported integration tests against the local L1 & L2 networks.

The network can be stopped using another script:

```bash
yarn script:oe:down
```

Or use the clean script, which will also delete all the images:

```bash
yarn script:oe:clean
```
