// SPDX-License-Identifier: MIT
// @unsupported: ovm
pragma solidity >0.5.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Interface Imports */
import { iOVM_L1TokenGateway } from "@eth-optimism/contracts/build/contracts/iOVM/bridge/tokens/iOVM_L1TokenGateway.sol";
import { Abs_L1TokenGateway } from "@eth-optimism/contracts/build/contracts/OVM/bridge/tokens/Abs_L1TokenGateway.sol";
import { iOVM_ERC20 } from "@eth-optimism/contracts/build/contracts/iOVM/precompiles/iOVM_ERC20.sol";

/* Library Imports */
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { OpUnsafe } from "../utils/OpUnsafe.sol";

/**
 * @title OVM_L1ERC20Gateway
 * @dev The L1 ERC20 Gateway is a contract which stores deposited L1 funds that are in use on L2.
 * It synchronizes a corresponding L2 ERC20 Gateway, informing it of deposits, and listening to it
 * for newly finalized withdrawals.
 *
 * NOTE: This contract extends Abs_L1TokenGateway, which is where we
 * takes care of most of the initialization and the cross-chain logic.
 * If you are looking to implement your own deposit/withdrawal contracts, you
 * may also want to extend the abstract contract in a similar manner.
 *
 * Compiler used: solc
 * Runtime target: EVM
 */
contract OVM_L1ERC20Gateway is OpUnsafe, Abs_L1TokenGateway {

  /********************************
   * External Contract References *
   ********************************/

  iOVM_ERC20 public l1ERC20;

  /***************
   * Constructor *
   ***************/

  /**
   * @param _l1ERC20 L1 ERC20 address this contract stores deposits for
   * @param _l2DepositedERC20 L2 Gateway address on the chain being deposited into
   */
  constructor(
    iOVM_ERC20 _l1ERC20,
    address _l2DepositedERC20,
    address _l1messenger
  )
    public
    Abs_L1TokenGateway(
      _l2DepositedERC20,
      _l1messenger
    )
  {
    l1ERC20 = _l1ERC20;
  }


  /**************
   * Depositing *
   **************/

  /**
   * @dev deposit an amount of ERC20 to a recipients's balance on L2
   * WARNING: This is a potentially unsafe operation that could end up with lost tokens,
   * if tokens are sent to a contract. Be careful!
   *
   * @param _to L2 address to credit the withdrawal to
   * @param _amount Amount of the ERC20 to deposit
   */
  function depositToUnsafe(
    address _to,
    uint _amount
  )
    public
    unsafe()
  {
    _initiateDeposit(msg.sender, _to, _amount);
  }


  /**************
   * Accounting *
   **************/

  /**
   * @dev When a deposit is initiated on L1, the L1 Gateway
   * transfers the funds to itself for future withdrawals
   *
   * @param _from L1 address ERC20 is being deposited from
   * @param _to L2 address that the ERC20 is being deposited to
   * @param _amount Amount of ERC20 to send
   */
  function _handleInitiateDeposit(
    address _from,
    address _to,
    uint256 _amount
  )
    internal
    override
  {
    // Unless explicitly unsafe op, stop deposits to contracts (avoid accidentally lost tokens)
    require(_isUnsafe() || !Address.isContract(_to), "Unsafe deposit to contract");

    // Hold on to the newly deposited funds
    l1ERC20.transferFrom(
      _from,
      address(this),
      _amount
    );
  }

  /**
   * @dev When a withdrawal is finalized on L1, the L1 Gateway
   * transfers the funds to the withdrawer
   *
   * @param _to L1 address that the ERC20 is being withdrawn to
   * @param _amount Amount of ERC20 to send
   */
  function _handleFinalizeWithdrawal(
    address _to,
    uint _amount
  )
    internal
    override
  {
    // Transfer withdrawn funds out to withdrawer
    l1ERC20.transfer(_to, _amount);
  }
}
