# LINK Token on Optimism

- `./token/IERC20Optimism.sol`: Interface for the bridged ERC20 token expected by the Optimism standard bridge L2 gateway.
- `./token/LinkTokenOptimism.sol`: Access controlled mintable & burnable LinkToken, for use on Optimism L2 network.

`LinkTokenOptimism.sol` is a slightly modified version of Optimism's [`L2StandardERC20.sol`](https://github.com/ethereum-optimism/optimism/blob/master/packages/contracts/contracts/optimistic-ethereum/libraries/standards/L2StandardERC20.sol) and will be connected to the [`OVM_L2StandardBridge.sol`](https://github.com/ethereum-optimism/optimism/blob/master/packages/contracts/contracts/optimistic-ethereum/OVM/bridge/tokens/OVM_L2StandardBridge.sol). Modifications include:

- Contract versioning via `ITypeAndVersion` interface
- ERC677 support by extending the `LinkToken` contract
- Transfers & approves to the contract itself blocked (provided by `LinkToken` contract)
- `l2Bridge` & `l1Token` were changed from storage vars to immutable vars, which provides some gas savings

The [Optimism Gateway](https://gateway.optimism.io) bridge UI can be used to move the tokens between networks.
