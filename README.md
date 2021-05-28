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

## ABI

- [v0.4](./contracts/v0.4#solidity-abi)
- [v0.6](./contracts/v0.6#solidity-abi)

```
[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_data","type":"bytes"}],"name":"transferAndCall","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"data","type":"bytes"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}]
```

You can also find interfaces and ABIs after running through the install `yarn setup` process. 

## Installation

The project contains [v0.4 contracts](./contracts/v0.4/) that were used for LINK Ethereum Mainnet deployment in 2017. For deployments moving forward, we use the updated [v0.6 contracts](./contracts/v0.6/) which use a more recent version of solc and the OpenZeppelin token standards. These updates include a minor ABI change around approval/allowance naming.

```bash
yarn install
```

## Testing

Setup contracts:

```bash
yarn setup
```

Run tests:

```bash
yarn test
```

This will test both v0.4 and v0.6 versions of the contracts.
