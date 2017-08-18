pragma solidity ^0.4.11;


import './token/ERC20.sol';
import './Standard223Token.sol';


contract LinkToken is Standard223Token {

  uint public constant totalSupply = 10**18;
  string public constant name = 'ChainLink Token';
  uint8 public constant decimals = 9;
  string public constant symbol = 'LINK';

  function LinkToken()
  public
  {
    balances[msg.sender] = totalSupply;
  }

  /**
  * @dev transfer token for a specified address.
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint _value)
  public validRecipient(_to) returns (bool success)
  {
    super.transfer(_to, _value);
  }


  // MODIFIERS

  modifier validRecipient(address _recipient) {
    require(_recipient != address(0));
    _;
  }

}
