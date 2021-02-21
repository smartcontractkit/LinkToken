
// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./swap/ISwap.sol";
import "../LinkToken.sol";

/**
 * @title LinkTokenWrapper
 * @notice Using this contract users can lock source tokens to be minted wrap tokens.
 * @dev Useful to add ERC677 functionality to ERC20 LINK bridge tokens.
 */
contract LinkTokenWrapper is ISwap, LinkToken {
  using SafeERC20 for IERC20;

  IERC20 private immutable _source;

  /**
   * @dev Create the LinkTokenWrapper token contract
   *
   * Requirements:
   * - `sourceAddr` cannot be the zero address.
   *
   * @param sourceAddr The address of source token contract
   */
  constructor(address sourceAddr)
    public
  {
    require(sourceAddr != address(0), "LinkTokenWrapper: sourceAddr is zero address");
    _source = IERC20(sourceAddr);
  }

  /**
   * @dev Overrides parent contract so no tokens are minted on deployment.
   * @inheritdoc LinkToken
   */
  function _onCreate()
    internal
    override
  {
    // noop
  }

  /// @inheritdoc ISwap
  function source()
    external
    view
    override
    returns (address)
  {
    return address(_source);
  }

  /// @inheritdoc ISwap
  function target()
    external
    view
    override
    returns (address)
  {
    return address(this);
  }

  /**
   * @dev Contract mints the `amount` of LinkTokenWrapper tokens.
   *
   * Requirements:
   * - the contract must have allowance for `caller`'s source tokens of at least `amount`.
   *
   * @inheritdoc ISwap
   */
  function deposit(uint256 amount)
    external
    override
  {
    _source.safeTransferFrom(msg.sender, address(this), amount);
    _mint(msg.sender, amount);
  }

  /**
   * @dev Contract burns the `amount` of LinkTokenWrapper tokens.
   *
   * @inheritdoc ISwap
   */
  function withdraw(uint256 amount)
    external
    override
  {
    _burn(msg.sender, amount);
    _source.safeTransfer(msg.sender, amount);
  }
}
