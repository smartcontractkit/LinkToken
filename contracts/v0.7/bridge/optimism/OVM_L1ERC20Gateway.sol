// SPDX-License-Identifier: MIT
// @unsupported: ovm
pragma solidity >0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Interface Imports */
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/* Library Imports */
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

/* Contract Imports */
import { Abs_L1TokenGateway } from "@eth-optimism/contracts/dist/contracts/OVM/bridge/tokens/Abs_L1TokenGateway.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/Initializable.sol";
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
contract OVM_L1ERC20Gateway is OpUnsafe, Initializable, Abs_L1TokenGateway {
  // L1 token we are bridging to L2
  IERC20 public s_l1ERC20;

  // This contract lives behind a proxy, so the constructor parameters will go unused.
  constructor()
    Abs_L1TokenGateway(
      address(0), // _l2DepositedToken
      address(0) // _l1messenger
    )
    public
  {}

  /**
   * @param l2ERC20Gateway L2 Gateway address on the chain being deposited into
   * @param l1Messenger Cross-domain messenger used by this contract.
   * @param l1ERC20 L1 ERC20 address this contract stores deposits for
   */
  function init(
    address l2ERC20Gateway,
    address l1Messenger,
    IERC20 l1ERC20
  )
    public
    initializer()
  {
    // TODO: require != address(0)?
    s_l1ERC20 = l1ERC20;
    // Init parent contracts
    l2DepositedToken = l2ERC20Gateway;
    messenger = l1Messenger;
  }

  /// @dev Modifier requiring the contract to be initialized
  modifier onlyInitialized() {
    require(address(l2DepositedToken) != address(0), "Contract not initialized");
    _;
  }

  /// @dev Returns L2 ERC20 Gateway address (AKA l2DepositedToken).
  function l2ERC20Gateway()
    public
    view
    returns (address)
  {
    // Default Optimism ERC20 bridge implemenation combines the L2 gateway and token
    // into a single OVM_L2DepositedERC20 contract. From the perspective of L1 gateway,
    // this should be just an implementation detail, so here we expose an address in a
    // different more general name "l2ERC20Gateway".
    return l2DepositedToken;
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
    onlyInitialized()
  {
    // Unless explicitly unsafe op, stop deposits to contracts (avoid accidentally lost tokens)
    require(_isUnsafe() || !Address.isContract(_to), "Unsafe deposit to contract");

    // Hold on to the newly deposited funds (must be approved)
    s_l1ERC20.transferFrom(
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
    onlyInitialized()
  {
    // Transfer withdrawn funds out to withdrawer
    s_l1ERC20.transfer(_to, _amount);
  }
}
