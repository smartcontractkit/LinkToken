pragma solidity ^0.4.8;


import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';


contract StandardTokenMock is StandardToken {

  function StandardTokenMock(address initialAccount, uint initialBalance)
  {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

}
