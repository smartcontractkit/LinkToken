pragma solidity ^0.4.8;

import './token/StandardToken.sol';
import './token/BasicToken.sol';
import './token/ERC20.sol';

contract LinkToken is StandardToken {
  uint public constant totalSupply = 10**18;
  string public constant name = 'ChainLink Token';
  uint8 public constant decimals = 9;
  string public constant symbol = 'LINK';

  function LinkToken() {
    balances[msg.sender] = totalSupply;
  }

}
