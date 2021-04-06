// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Contract Imports */
import { LinkToken } from "../../../v0.6/LinkToken.sol";

/* Library Imports */
import { Abs_L2DepositedToken } from "@eth-optimism/contracts/build/contracts/OVM/bridge/tokens/Abs_L2DepositedToken.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { OpUnsafe } from "../utils/OpUnsafe.sol";
import { OVM_Address } from "./OVM_Address.sol";

/**
 * @title OVM_L2DepositedLinkToken
 * @dev The L2 Deposited LinkToken is an token implementation which represents L1 assets deposited into L2.
 * This contract mints new tokens when it hears about deposits into the L1 token gateway.
 * This contract also burns the tokens intended for withdrawal, informing the L1 gateway to release L1 funds.
 *
 * Compiler used: optimistic-solc
 * Runtime target: OVM
 */
contract OVM_L2DepositedLinkToken is OpUnsafe, Abs_L2DepositedToken, LinkToken {

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
   * @dev initiate a withdraw of some token to a recipient's account on L1
   * WARNING: This is a potentially unsafe operation that could end up with lost tokens,
   * if tokens are sent to a contract. Be careful!
   *
   * @param _to L1 adress to credit the withdrawal to
   * @param _amount Amount of the token to withdraw
   */
  function withdrawToUnsafe(
    address _to,
    uint _amount
  )
    external
    onlyInitialized()
    unsafe()
  {
    _initiateWithdrawal(_to, _amount);
  }

  /**
   * @dev When a withdrawal is initiated, we burn the funds to prevent subsequent L2 usage.
   * @inheritdoc Abs_L2DepositedToken
   */
  function _handleInitiateWithdrawal(
    address _to,
    uint _amount
  )
    internal
    override
  {
    // Unless explicitly unsafe op, stop withdrawals to contracts (avoid accidentally lost tokens)
    require(_isUnsafe() || !Address.isContract(_to) || OVM_Address.isEOAContract(_to), "Unsafe withdraw to contract");

    _burn(msg.sender, _amount);
  }

  /**
   * @dev When a deposit is finalized, we credit the account on L2 with the same amount of tokens.
   * @inheritdoc Abs_L2DepositedToken
   */
  function _handleFinalizeDeposit(
    address _to,
    uint _amount
  )
    internal
    override
  {
    _mint(_to, _amount);
  }
}
