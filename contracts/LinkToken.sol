pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import './token/LinkERC20.sol';
import './ERC677Token.sol';

contract LinkToken is ERC20, LinkERC20, ERC677Token {

  uint private constant TOTAL_SUPPLY = 10**27;
  string private constant NAME = 'ChainLink Token';
  string private constant SYMBOL = 'LINK';

  constructor() ERC20(NAME, SYMBOL)
    public
  {
    _onCreate();
  }

  /**
   * @dev Hook that is called when this contract is created.
   * Useful to override constructor behaviour in child contracts (e.g., LINK bridge tokens).
   * @notice Default implementation mints 10**27 tokens to msg.sender
   */
  function _onCreate()
    internal
    virtual
  {
    _mint(msg.sender, TOTAL_SUPPLY);
  }

  /**
   * @dev transfer token to a specified address with additional data if the recipient is a contract.
   * @param _to The address to transfer to.
   * @param _value The amount to be transferred.
   * @param _data The extra data to be passed to the receiving contract.
   */
  function transferAndCall(address _to, uint _value, bytes memory _data)
    public
    override
    validRecipient(_to)
    returns (bool success)
  {
    return super.transferAndCall(_to, _value, _data);
  }

  /**
   * @dev transfer token to a specified address.
   * @param _to The address to transfer to.
   * @param _value The amount to be transferred.
   */
  function transfer(address _to, uint _value)
    public
    override
    validRecipient(_to)
    returns (bool success)
  {
    return super.transfer(_to, _value);
  }

  /**
   * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
   * @param _spender The address which will spend the funds.
   * @param _value The amount of tokens to be spent.
   */
  function approve(address _spender, uint256 _value)
    public
    override
    validRecipient(_spender)
    returns (bool)
  {
    return super.approve(_spender,  _value);
  }

  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(address _from, address _to, uint256 _value)
    public
    override
    validRecipient(_to)
    returns (bool)
  {
    return super.transferFrom(_from, _to, _value);
  }


  // MODIFIERS

  modifier validRecipient(address _recipient) {
    require(_recipient != address(0) && _recipient != address(this));
    _;
  }
}
