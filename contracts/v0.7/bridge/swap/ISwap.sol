// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/**
 * @title ISwap
 * @dev Token swap interface to enable users to swap between
 * source and target tokens.
 */
interface ISwap {
  /// @return source token address
  function source() external view returns (address);

  /// @return target token address
  function target() external view returns (address);

  /**
   * @notice Moves `amount` tokens from the caller's source account to target account.
   * @param amount to deposit.
   */
  function deposit(uint256 amount) external;

  /**
   * @notice Moves `amount` tokens from the caller's target account to source account.
   * @param amount to withdraw.
   */
  function withdraw(uint256 amount) external;
}
