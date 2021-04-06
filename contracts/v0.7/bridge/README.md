# LINK Token Bridge v0.7

- `./token/LinkTokenChild.sol`: A mintable & burnable child LinkToken contract to be used on child networks.

## Optimism L2 bridge

The Optimistic Virtual Machine (OVM) is a scalable form of the EVM. Optimistic Rollup, by [Optimism](https://optimism.io), is the core scaling solution which enables the off-chain OVM to achieve cheap, instant transactions that still inherit L1 security. The OVM is an EVM-based VM which supports optimistically executing EVM smart contracts on a layer 1 blockchain like Ethereum. It is structured in such a way that it is possible to verify individual steps of its computation on Ethereum mainnet. This allows the mainnet to enforce validity of state roots with fraud proofs in the layer 2 Optimistic Rollup chain. For more information consult the [Optimism developer documentation](https://community.optimism.io/docs/).

The set of contracts needed for the Optimism L2 LinkToken bridge can be found in the [./optimism](./optimism) dir.

- `./optimism/OVM_EOACodeHashSet.sol`: Abstract helper contract used to keep track of OVM EOA contract set (OVM specific)
- `./optimism/OVM_L1ERC20Gateway.sol`: Contract which stores deposited L1 funds that are in use on L2, and unlocks/transfers L1 funds on withdrawal. It synchronizes a corresponding L2 ERC20 Gateway, informing it of deposits, and listening to it for newly finalized withdrawals. (delegate proxy deployment)
- `./optimism/OVM_L2ERC20Gateway.sol`: Contract which mints deposited L2 funds that are locked on L1, and burns L2 funds on withdrawal. It synchronizes a corresponding L1 ERC20 Gateway, informing it of withdrawals, and listening to it for newly finalized deposits. (delegate proxy deployment)

These contracts are an implementation of [abstracts bridge contracts provided by Optimism](https://github.com/ethereum-optimism/optimism/tree/master/packages/contracts/contracts/optimistic-ethereum/OVM/bridge/tokens).
