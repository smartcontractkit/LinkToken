// SPDX-License-Identifier: MIT
// @unsupported: ovm
pragma solidity >0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Interface Imports */
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC677Receiver } from "../../../v0.6/token/ERC677Receiver.sol";

/* Library Imports */
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

/* Contract Imports */
import { Initializable } from "@openzeppelin/contracts/proxy/Initializable.sol";
import { Abs_L1TokenGateway } from "@eth-optimism/contracts/OVM/bridge/tokens/Abs_L1TokenGateway.sol";

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
contract OVM_L1ERC20Gateway is ERC677Receiver, Initializable, Abs_L1TokenGateway {
  // L1 token we are bridging to L2
  IERC20 public s_l1ERC20;

  /// @dev This contract lives behind a proxy, so the constructor parameters will go unused.
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
  function initialize(
    address l2ERC20Gateway,
    address l1Messenger,
    address l1ERC20
  )
    public
    virtual
    initializer()
  {
    __OVM_L1ERC20Gateway_init(l2ERC20Gateway, l1Messenger, l1ERC20);
  }

  /**
   * @param l2ERC20Gateway L2 Gateway address on the chain being deposited into
   * @param l1Messenger Cross-domain messenger used by this contract.
   * @param l1ERC20 L1 ERC20 address this contract stores deposits for
   */
  function __OVM_L1ERC20Gateway_init(
    address l2ERC20Gateway,
    address l1Messenger,
    address l1ERC20
  )
    internal
    initializer()
  {
    // Init parent contracts
    require(l2ERC20Gateway != address(0), "Init to zero address");
    require(l1Messenger != address(0), "Init to zero address");

    l2DepositedToken = l2ERC20Gateway;
    messenger = l1Messenger;

    __OVM_L1ERC20Gateway_init_unchained(l1ERC20);
  }

  /**
   * @param l1ERC20 L1 ERC20 address this contract stores deposits for
   */
  function __OVM_L1ERC20Gateway_init_unchained(
    address l1ERC20
  )
    internal
    initializer()
  {
    require(l1ERC20 != address(0), "Init to zero address");
    s_l1ERC20 = IERC20(l1ERC20);
  }

  /// @dev Modifier requiring the contract to be initialized
  modifier onlyInitialized() {
    require(address(l2DepositedToken) != address(0), "Contract not initialized");
    _;
  }

  /// @dev Modifier requiring sender to be EOA
  modifier onlyEOA(address acc) {
    // Used to stop withdrawals to contracts (avoid accidentally lost tokens)
    require(!Address.isContract(acc), "Account not EOA");
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

  /**
   * @dev Hook on successful token transfer that initializes deposit
   * @notice Avoids two step approve/transferFrom, only accessible by EOA sender via ERC677 transferAndCall.
   * @inheritdoc ERC677Receiver
   */
  function onTokenTransfer(
    address _sender,
    uint _value,
    bytes memory /* _data */
  )
    external
    override
    onlyEOA(_sender)
  {
    require(msg.sender == address(s_l1ERC20), "onTokenTransfer sender not valid");
    _initiateDeposit(_sender, _sender, _value);
  }

  /**
   * @notice Only accessible by EOA sender.
   * @inheritdoc Abs_L1TokenGateway
   */
  function deposit(
    uint _amount
  )
    external
    override
    onlyEOA(msg.sender)
  {
    _initiateDeposit(msg.sender, msg.sender, _amount);
  }

  /**
   * @notice Recipient account must be EOA.
   * @inheritdoc Abs_L1TokenGateway
   */
  function depositTo(
    address _to,
    uint _amount
  )
    external
    override
    onlyEOA(_to)
  {
    _initiateDeposit(msg.sender, _to, _amount);
  }

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
    external
  {
    _initiateDeposit(msg.sender, _to, _amount);
  }

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
    // Funds already transfered via trasferAndCall (skipping)
    if (msg.sender == address(s_l1ERC20)) return;

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
