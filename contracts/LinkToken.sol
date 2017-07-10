pragma solidity ^0.4.8;


import './token/StandardToken.sol';
import './token/Standard223Token.sol';
import './token/ERC20.sol';


contract LinkToken is StandardToken, Standard223Token {

  uint public constant totalSupply = 10**18;
  string public constant name = 'ChainLink Token';
  uint8 public constant decimals = 9;
  string public constant symbol = 'LINK';

  function LinkToken()
  {
    balances[msg.sender] = totalSupply;
  }

  function transfer(address _to, uint _value)
  public validRecipient(_to)
  {
    super.transfer(_to, _value);
  }


  // MODIFIERS

  modifier validRecipient(address _recipient) {
    if (_recipient == address(0) || _recipient == address(this))
      throw;
    _;
  }

}
