# LINK Token on Avalanche

- `./token/IERC20Avalanche.sol`: Interface for the bridged ERC20 token expected by the Avalanche standard bridge.
- `./token/LinkTokenAvalanche.sol`: Access controlled mintable & burnable LinkToken, for use on Avalanche network.

`LinkTokenAvalanche.sol` is a slightly modified version of Avalanche's standard bridged ERC20 token and will be connected to the bridge operator once the bridge is online and operational. Modifications include:

- Contract versioning via `ITypeAndVersion` interface
- ERC677 support by extending the `LinkToken` contract
- Transfers & approves to the contract itself blocked (provided by `LinkToken` contract)
- Using OZ's `Ownable` contract to express the bridge operator role instead the original custom `Roles` contract

The public bridge contracts source code and addresses are still TBA by the Avalanche team.
