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

/// @dev Access controlled mintable & burnable LinkToken, for use on sidechains and L2 networks.
contract LinkTokenChild is ITypeAndVersion, IERC20Child, SimpleWriteAccessController, ERC20Burnable, LinkToken {
  /**
   * @dev Overrides parent contract so no tokens are minted on deployment.
   * @inheritdoc LinkToken
   */
  function _onCreate()
    internal
    override
  {}

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
