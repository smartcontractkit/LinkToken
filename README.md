# LINK Token Contracts

The LINK token is an [EIP20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20-token-standard.md) token with additional [ERC667](https://github.com/ethereum/EIPs/issues/677) functionality.

The total supply of the token is 1,000,000,000, and each token is divisibe up to 18 decimal places.

To prevent accidental burns, the token does not allow transfers to the contract itself and to 0x0.

## Installation
```
npm install
```

## Testing
Run a test network:
```
./server.sh
```

Then, run the test suite:
```
truffle test
```
