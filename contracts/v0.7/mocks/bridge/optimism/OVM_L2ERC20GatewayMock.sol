// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Interface Imports */
import { IERC20Child } from "../../../bridge/token/IERC20Child.sol";

/* Contract Imports */
import { OVM_L2ERC20Gateway } from "../../../bridge/optimism/OVM_L2ERC20Gateway.sol";

/**
 * @title OVM_L2ERC20GatewayMock
 *
 * Compiler used: optimistic-solc
 * Runtime target: OVM
 */
contract OVM_L2ERC20GatewayMock is OVM_L2ERC20Gateway {
  /// Helper fn used in tests to fake L2 deposits
  function mockFinalizeDeposit(
    address to,
    uint amount
  )
    external
    onlyInitialized()
  {
    _handleFinalizeDeposit(to, amount);
    emit DepositFinalized(to, amount);
  }
}
