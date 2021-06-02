// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import "./token/LinkERC20.sol";
import "./ERC677.sol";
import "./ITypeAndVersion.sol";

/// @dev LinkToken, an ERC20/ERC677 Chainlink token with 1 billion supply
contract LinkToken is ITypeAndVersion, LinkERC20, ERC677 {
  uint private constant TOTAL_SUPPLY = 10**27;
  string private constant NAME = 'ChainLink Token';
  string private constant SYMBOL = 'LINK';

  constructor()
    ERC20(NAME, SYMBOL)
    public
  {
    _onCreate();
  }

  /**
   * @notice versions:
   *
   * - LinkToken 0.0.3: added versioning, update name
   * - LinkToken 0.0.2: upgraded to solc 0.6
   * - LinkToken 0.0.1: initial release solc 0.4
   *
   * @inheritdoc ITypeAndVersion
   */
  function typeAndVersion()
    external
    pure
    override
    virtual
    returns (string memory)
  {
    return "LinkToken 0.0.3";
  }

  /**
   * @dev Hook that is called when this contract is created.
   * Useful to override constructor behaviour in child contracts (e.g., LINK bridge tokens).
   * @notice Default implementation mints 10**27 tokens to msg.sender
   */
  function _onCreate()
    internal
    virtual
  {
    _mint(msg.sender, TOTAL_SUPPLY);
  }

  /**
   * @dev Check if recepient is a valid address before transfer
   * @inheritdoc ERC20
   */
  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  )
    internal
    override
    virtual
    validAddress(recipient)
  {
    super._transfer(sender, recipient, amount);
  }

  /**
   * @dev Check if spender is a valid address before approval
   * @inheritdoc ERC20
   */
  function _approve(
    address owner,
    address spender,
    uint256 amount
  )
    internal
    override
    virtual
    validAddress(spender)
  {
    super._approve(owner, spender, amount);
  }

  /**
   * @dev Check if recipient is valid (not this contract address)
   * @param recipient the account we transfer/approve to
   */
  modifier validAddress(
    address recipient
  )
    virtual
  {
    require(recipient != address(this), "LinkToken: transfer/approve to this contract address");
    _;
  }
}
