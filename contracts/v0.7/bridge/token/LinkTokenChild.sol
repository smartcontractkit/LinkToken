// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/* Interface Imports */
import { IERC20Child } from "./IERC20Child.sol";

/* Contract Imports */
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { LinkToken } from "../../../v0.6/LinkToken.sol";

/// @dev Access controlled mintable & burnable LinkToken, for use on sidechains and L2 networks.
contract LinkTokenChild is IERC20Child, AccessControl, LinkToken {

  // Using this role the bridge gateway can deposit/withdraw (mint/burn)
  bytes32 public constant BRIDGE_GATEWAY_ROLE = keccak256("BRIDGE_GATEWAY_ROLE");

  /**
   * @dev Overrides parent contract so no tokens are minted on deployment.
   * @inheritdoc LinkToken
   */
  function _onCreate()
    internal
    override
  {
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
  }

  /**
   * @dev Modifier to check access by role.
   *
   * @param role the required role
   */
  modifier onlyRole(
    bytes32 role
  ) {
    require(hasRole(role, _msgSender()), "LinkTokenChild: missing role");
    _;
  }

  /**
   * @dev Only callable by account with BRIDGE_GATEWAY_ROLE
   * @inheritdoc IERC20Child
   */
  function deposit(
    address recipient,
    uint256 amount
  )
    external
    override
    virtual
    onlyRole(BRIDGE_GATEWAY_ROLE)
  {
    _mint(recipient, amount);
  }

  /**
   * @dev Only callable by account with BRIDGE_GATEWAY_ROLE
   * @inheritdoc IERC20Child
   */
  function withdraw(
    uint256 amount
  )
    external
    override
    virtual
    onlyRole(BRIDGE_GATEWAY_ROLE)
  {
    _burn(_msgSender(), amount);
  }
}
