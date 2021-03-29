// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Contract Imports */
import { OVM_L2DepositedLinkToken } from "../../../bridge/optimism/OVM_L2DepositedLinkToken.sol";

/**
 * @title OVM_L2DepositedLinkTokenMock
 *
 * Compiler used: optimistic-solc
 * Runtime target: OVM
 */
contract OVM_L2DepositedLinkTokenMock is OVM_L2DepositedLinkToken {

  /**
   * @param l2CrossDomainMessenger Cross-domain messenger used by this contract.
   */
  constructor(
    address l2CrossDomainMessenger
  )
    public
    OVM_L2DepositedLinkToken(l2CrossDomainMessenger)
  {}

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
