pragma solidity ^0.4.8;


import 'openzeppelin-solidity/contracts/token/ERC20/BasicToken.sol';


// mock class using BasicToken
contract BasicTokenMock is BasicToken {

  function BasicTokenMock(address initialAccount, uint initialBalance)
  {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

}
