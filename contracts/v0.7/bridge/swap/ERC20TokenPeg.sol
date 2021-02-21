
// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./ISwap.sol";

/**
 * @title ERC20TokenPeg
 * @notice Using this contract users can swap between pegged source and target tokens.
 * @dev Make sure only to deploy with target ERC20 token having a fixed supply
 * as this contract assumes a simple 1:1 fixed peg.
 */
contract ERC20TokenPeg is ISwap, Initializable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  IERC20 private immutable _source;
  IERC20 private immutable _target;

  /**
   * @dev Create the ERC20TokenPeg between two tokens
   *
   * Requirements:
   * - `sourceAddr` and `targetAddr` cannot be the zero address.
   * - `sourceAddr` and `targetAddr` cannot be the same contracts.
   *
   * @param sourceAddr The address of source token contract
   * @param targetAddr The address of target token contract
   */
  constructor(
    address sourceAddr,
    address targetAddr
  )
    public
  {
    require(sourceAddr != address(0), "ERC20TokenPeg: sourceAddr is zero address");
    require(targetAddr != address(0), "ERC20TokenPeg: targetAddr is zero address");
    require(sourceAddr != targetAddr, "ERC20TokenPeg: sourceAddr == targetAddr");
    _source = IERC20(sourceAddr);
    _target = IERC20(targetAddr);
  }

  /**
   * @dev Initialize the ERC20TokenPeg, only once!
   *
   * Contract will transfer from caller and lock source token in the amount of
   * the circulating supply of target token. Additionally, the contract will
   * transfer from caller and lock target tokens in the amount of the
   * uncirculated supply (callers balance).
   *
   * Requirements:
   * - the contract must have allowance for `caller`'s source tokens of at least
   * target token circulating supply `amount`.
   * - the contract must have allowance for `caller`'s target tokens of at least
   * target token uncirculated supply `amount`.
   */
  function init()
    external
    initializer()
  {
    uint256 lockedSupply = _target.balanceOf(msg.sender);
    uint256 circulatingSupply = _target.totalSupply().sub(lockedSupply);
    // Transfer source tokens from sender to cover target's circulating supply
    _source.safeTransferFrom(msg.sender, address(this), circulatingSupply);
    // Transfer target tokens from sender to lock uncirculated supply
    _target.safeTransferFrom(msg.sender, address(this), lockedSupply);
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
    return address(_target);
  }

  /**
   * @dev the contract must have allowance for `caller`'s source tokens of at least `amount`.
   * @inheritdoc ISwap
   */
  function deposit(uint256 amount)
    external
    override
  {
    _source.safeTransferFrom(msg.sender, address(this), amount);
    _target.safeTransfer(msg.sender, amount);
  }

  /**
   * @dev the contract must have allowance for `caller`'s target tokens of at least `amount`.
   * @inheritdoc ISwap
   */
  function withdraw(uint256 amount)
    external
    override
  {
    _target.safeTransferFrom(msg.sender, address(this), amount);
    _source.safeTransfer(msg.sender, amount);
  }
}
