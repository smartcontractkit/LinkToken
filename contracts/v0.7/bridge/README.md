# LINK Token Bridge v0.7

- `./token/LinkTokenChild.sol`: A generalized mintable & burnable child LinkToken contract to be used on child networks.

NOTICE: Current implementation of LinkTokenChild contract requires some additional consideration:

- Supporting more than one gateway (multiple bridges minting the same token) leaves room for accounting issues.
  If we have more than one gateway supported, an additional check needs to exist that limits withdrawals per
  gateway to an amount locked on L1, for the specific gateway. Otherwise one can accidentally "burn" tokens
  by withdrawing more than locked in L1 (tx will fail on L1). When there is a 1:1 relationship between the
  gateway and token, the token itself is an accounting mechanism. For a potential N:1 relationship, a more
  sophisticated type of accounting needs to exist.
- Every bridge is unique in the amount of risk it bears, so tokens bridged by different bridges are not 1:1
  the same token, and shouldn't be forced as such.
- Bridges often require an unique interface to be supported by the child network tokens
  (e.g. `mint` vs. `deposit`, `burn` vs. `withdraw/unwrap`, etc.).
- Bridges often assume that the child contract they are bridging to is the ERC20 token itself, not a gateway
  (intermediate contract) that could help us map from the specific bridge interface to our standard
  LinkTokenChild interface.
- Chainlink often needs to launch on a new network before the native bridge interface is defined.
- To support early (before the bridge is defined) Chainlink network launch, we could make an upgradeable
  LinkTokenChild contract which would enable us to slightly update the contract interface after the bridge
  gets defined, and once online transfer the ownership (bridge gateway role) to the new bridge.

TODO: Potentially create an upgradeable `LinkTokenChild.sol` and limit gateway support to only one (owner)!

- `./token/avalanche/`: Documentation and token implementation for the Avalanche bridge v2.
