// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Interface Imports */
import { IERC20Child } from "../token/IERC20Child.sol";
import { ERC677Receiver } from "../../../v0.6/token/ERC677Receiver.sol";

/* Library Imports */
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

/* Contract Imports */
import { Initializable } from "@openzeppelin/contracts/proxy/Initializable.sol";
import { iOVM_L1TokenGateway } from "@eth-optimism/contracts/iOVM/bridge/tokens/iOVM_L1TokenGateway.sol";
import { Abs_L2DepositedToken } from "@eth-optimism/contracts/OVM/bridge/tokens/Abs_L2DepositedToken.sol";
import { OVM_EOACodeHashSet } from "./OVM_EOACodeHashSet.sol";

/**
 * @title OVM_L2ERC20Gateway
 * @dev The L2 Deposited LinkToken is an token implementation which represents L1 assets deposited into L2.
 * This contract mints new tokens when it hears about deposits into the L1 token gateway.
 * This contract also burns the tokens intended for withdrawal, informing the L1 gateway to release L1 funds.
 *
 * Compiler used: optimistic-solc
 * Runtime target: OVM
 */
contract OVM_L2ERC20Gateway is ERC677Receiver, /* Initializable, */ OVM_EOACodeHashSet, Abs_L2DepositedToken {
  // Bridged L2 token
  IERC20Child public s_l2ERC20;

  /// @dev This contract lives behind a proxy, so the constructor parameters will go unused.
  constructor()
    Abs_L2DepositedToken(
      address(0) // _l2CrossDomainMessenger
    )
    public
  {}

  /**
   * @param l1ERC20Gateway L1 Gateway address on the chain being withdrawn into
   * @param l2Messenger Cross-domain messenger used by this contract.
   * @param l2ERC20 L2 ERC20 address this contract deposits for
   */
  function initialize(
    address l1ERC20Gateway,
    address l2Messenger,
    address l2ERC20
  )
    public
    virtual
    initializer()
  {
    __OVM_L2ERC20Gateway_init(l1ERC20Gateway, l2Messenger, l2ERC20);
  }

  /**
   * @param l1ERC20Gateway L1 Gateway address on the chain being withdrawn into
   * @param l2Messenger Cross-domain messenger used by this contract.
   * @param l2ERC20 L2 ERC20 address this contract deposits for
   */
  function __OVM_L2ERC20Gateway_init(
    address l1ERC20Gateway,
    address l2Messenger,
    address l2ERC20
  )
    internal
    initializer()
  {
    __Context_init_unchained();
    __Ownable_init_unchained();

    // Init parent contracts
    require(l1ERC20Gateway != address(0), "Init to zero address");
    require(l2Messenger != address(0), "Init to zero address");
    // Abs_L2DepositedToken
    init(iOVM_L1TokenGateway(l1ERC20Gateway));
    // OVM_CrossDomainEnabled
    messenger = l2Messenger;

    __OVM_EOACodeHashSet_init_unchained();
    __OVM_L2ERC20Gateway_init_unchained(l2ERC20);
  }

  /**
   * @param l2ERC20 L2 ERC20 address this contract deposits for
   */
  function __OVM_L2ERC20Gateway_init_unchained(
    address l2ERC20
  )
    internal
    initializer()
  {
    require(l2ERC20 != address(0), "Init to zero address");
    s_l2ERC20 = IERC20Child(l2ERC20);
  }

  /// @dev Modifier requiring sender to be EOA
  modifier onlyEOA(address acc) {
    // Used to stop withdrawals to contracts (avoid accidentally lost tokens)
    require(!Address.isContract(acc) || _isEOAContract(acc), "Account not EOA");
    _;
  }

  /**
   * @dev Hook on successful token transfer that initializes withdrawal
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
    require(msg.sender == address(s_l2ERC20), "onTokenTransfer sender not valid");
    _initiateWithdrawal(_sender, _value);
  }

  /**
   * @notice Only accessible by EOA sender.
   * @inheritdoc Abs_L2DepositedToken
   */
  function withdraw(
    uint _amount
  )
    external
    override
    onlyEOA(msg.sender)
  {
    _initiateWithdrawal(msg.sender, _amount);
  }

  /**
   * @notice Recipient account must be EOA.
   * @inheritdoc Abs_L2DepositedToken
   */
  function withdrawTo(
    address _to,
    uint _amount
  )
    external
    override
    onlyEOA(_to)
  {
    _initiateWithdrawal(_to, _amount);
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
    onlyInitialized()
  {
    // Check if funds already transfered via trasferAndCall (skipping)
    if (msg.sender != address(s_l2ERC20)) {
      // Take the newly deposited funds (must be approved)
      s_l2ERC20.transferFrom(
        msg.sender,
        address(this),
        _amount
      );
    }

    // And withdraw them to L1
    s_l2ERC20.withdraw(_amount);
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
    onlyInitialized()
  {
    s_l2ERC20.deposit(_to, _amount);
  }
}
