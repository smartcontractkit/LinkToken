pragma solidity ^0.4.8;


import '../StandardToken.sol';


contract StandardTokenMock is StandardToken {

  function StandardTokenMock(address initialAccount, uint initialBalance)
  {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

}
