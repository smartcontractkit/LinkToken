// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/* Interface Imports */
import { ITypeAndVersion } from "../../../v0.6/ITypeAndVersion.sol";
import { IERC20Child } from "./IERC20Child.sol";

/* Contract Imports */
import { ERC20 } from "../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/ERC20Burnable.sol";
import { SimpleWriteAccessController } from "../../../../vendor/smartcontractkit/chainlink/evm-contracts/src/v0.6/SimpleWriteAccessController.sol";
import { LinkToken } from "../../../v0.6/LinkToken.sol";

/**
 * @dev Access controlled mintable & burnable LinkToken, for use on sidechains and L2 networks.
 *
 * NOTICE: Current implementation of LinkTokenChild contract requires some additional consideration:
 *  - Supporting more than one gateway (multiple bridges minting the same token) leaves room for accounting issues.
 *      If we have more than one gateway supported, an additional check needs to exist that limits withdrawals per
 *      gateway to an amount locked on L1, for the specific gateway. Otherwise one can accidentally "burn" tokens
 *      by withdrawing more than locked in L1 (tx will fail on L1). When there is a 1:1 relationship between the
 *      gateway and token, the token itself is an accounting mechanism. For a potential N:1 relationship, a more
 *      sophisticated type of accounting needs to exist.
 *  - Every bridge is unique in the amount of risk it bears, so tokens bridged by different bridges are not 1:1
 *      the same token, and shouldn't be forced as such.
 *  - Bridges often require an unique interface to be supported by the child network tokens
 *      (e.g. mint` vs. `deposit`, `burn` vs. `withdraw/unwrap`, etc.).
 *  - Bridges often assume that the child contract they are bridging to is the ERC20 token itself, not a gateway
 *      (intermediate contract) that could help us map from the specific bridge interface to our standard
 *      LinkTokenChild interface.
 *  - Chainlink often needs to launch on a new network before the native bridge interface is defined.
 *  - To support early (before the bridge is defined) Chainlink network launch, we could make an upgradeable
 *      LinkTokenChild contract which would enable us to slightly update the contract interface after the bridge
 *      gets defined, and once online transfer the ownership (bridge gateway role) to the new bridge.
 *
 * TODO: Make upgradeable and limit gateway support to only one (owner)!
 */
contract LinkTokenChild is ITypeAndVersion, IERC20Child, SimpleWriteAccessController, ERC20Burnable, LinkToken {
  /**
   * @notice versions:
   *
   * - LinkTokenChild 0.0.1: initial release
   *
   * @inheritdoc ITypeAndVersion
   */
  function typeAndVersion()
    external
    pure
    override(ITypeAndVersion, LinkToken)
    virtual
    returns (string memory)
  {
    return "LinkTokenChild 0.0.1";
  }

  /**
   * @dev Only callable by account with access (gateway role)
   * @inheritdoc IERC20Child
   */
  function mint(
    address recipient,
    uint256 amount
  )
    public
    override
    virtual
    checkAccess()
  {
    _mint(recipient, amount);
  }

  /**
   * @dev Only callable by account with access (gateway role)
   * @inheritdoc ERC20Burnable
   */
  function burn(
    uint256 amount
  )
    public
    override(IERC20Child, ERC20Burnable)
    virtual
    checkAccess()
  {
    super.burn(amount);
  }

  /**
   * @dev Only callable by account with access (gateway role)
   * @inheritdoc ERC20Burnable
   */
  function burnFrom(
    address account,
    uint256 amount
  )
    public
    override(IERC20Child, ERC20Burnable)
    virtual
    checkAccess()
  {
    super.burnFrom(account, amount);
  }

  /**
   * @dev Overrides parent contract so no tokens are minted on deployment.
   * @inheritdoc LinkToken
   */
  function _onCreate()
    internal
    override
  {}

  /// @inheritdoc LinkToken
  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  )
    internal
    override(ERC20, LinkToken)
    virtual
  {
    super._transfer(sender, recipient, amount);
  }

  /// @inheritdoc LinkToken
  function _approve(
    address owner,
    address spender,
    uint256 amount
  )
    internal
    override(ERC20, LinkToken)
    virtual
  {
    super._approve(owner, spender, amount);
  }
}
