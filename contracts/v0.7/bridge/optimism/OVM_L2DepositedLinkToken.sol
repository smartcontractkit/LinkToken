// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Contract Imports */
import { LinkToken } from "../../LinkToken.sol";

/* Library Imports */
import { Abs_L2DepositedToken } from "@eth-optimism/contracts/build/contracts/OVM/bridge/tokens/Abs_L2DepositedToken.sol";

/**
 * @title OVM_L2DepositedLinkToken
 * @dev The L2 Deposited LinkToken is an token implementation which represents L1 assets deposited into L2.
 * This contract mints new tokens when it hears about deposits into the L1 token gateway.
 * This contract also burns the tokens intended for withdrawal, informing the L1 gateway to release L1 funds.
 *
 * Compiler used: optimistic-solc
 * Runtime target: OVM
 */
contract OVM_L2DepositedLinkToken is Abs_L2DepositedToken, LinkToken {

  /**
   * @param l2CrossDomainMessenger Cross-domain messenger used by this contract.
   */
  constructor(
    address l2CrossDomainMessenger
  )
    public
    Abs_L2DepositedToken(l2CrossDomainMessenger)
  {}

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

  /**
   * @dev When a withdrawal is initiated, we burn the funds to prevent subsequent L2 usage.
   * @inheritdoc Abs_L2DepositedToken
   */
  function _handleInitiateWithdrawal(
    address /* to */,
    uint amount
  )
    internal
    override
  {
    _burn(msg.sender, amount);
  }

  /**
   * @dev When a deposit is finalized, we credit the account on L2 with the same amount of tokens.
   * @inheritdoc Abs_L2DepositedToken
   */
  function _handleFinalizeDeposit(
    address to,
    uint amount
  )
    internal
    override
  {
    _mint(to, amount);
  }
}
