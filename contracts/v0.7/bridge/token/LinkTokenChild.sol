// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/* Interface Imports */
import { TypeAndVersionInterface } from "../../../v0.6/TypeAndVersionInterface.sol";
import { IERC20Child } from "./IERC20Child.sol";

/* Contract Imports */
import { SimpleWriteAccessController } from "../../../vendor/@chainlink/contracts/0.1.7/contracts/v0.6/SimpleWriteAccessController.sol";
import { LinkToken } from "../../../v0.6/LinkToken.sol";

/// @dev Access controlled mintable & burnable LinkToken, for use on sidechains and L2 networks.
contract LinkTokenChild is TypeAndVersionInterface, IERC20Child, SimpleWriteAccessController, LinkToken {
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
   * @inheritdoc TypeAndVersionInterface
   */
  function typeAndVersion()
    external
    pure
    override(LinkToken, TypeAndVersionInterface)
    virtual
    returns (string memory)
  {
    return "LinkTokenChild 0.0.1";
  }

  /**
   * @dev Only callable by account with access (gateway role)
   * @inheritdoc IERC20Child
   */
  function deposit(
    address recipient,
    uint256 amount
  )
    external
    override
    virtual
    checkAccess()
  {
    _mint(recipient, amount);
  }

  /**
   * @dev Only callable by account with access (gateway role)
   * @inheritdoc IERC20Child
   */
  function withdraw(
    uint256 amount
  )
    external
    override
    virtual
    checkAccess()
  {
    _burn(_msgSender(), amount);
  }
}
