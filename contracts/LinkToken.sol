pragma solidity ^0.4.11;


import './token/ERC20.sol';
import './Standard223Token.sol';


contract LinkToken is Standard223Token {

  uint public constant totalSupply = 10**27;
  string public constant name = 'ChainLink Token';
  uint8 public constant decimals = 18;
  string public constant symbol = 'LINK';

  function LinkToken()
  public
  {
    balances[msg.sender] = totalSupply;
  }

  /**
  * @dev transfer token to a specified address with data.
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  * @param _data The extra data to be passed to the receiving contract.
  */
  function transfer(address _to, uint _value, bytes _data)
  public validRecipient(_to) returns (bool success)
  {
    return super.transfer(_to, _value, _data);
  }

  /**
  * @dev transfer token to a specified address.
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint _value)
  public validRecipient(_to) returns (bool success)
  {
    return super.transfer(_to, _value);
  }


  // MODIFIERS

  modifier validRecipient(address _recipient) {
    require(_recipient != address(0));
    _;
  }

}
