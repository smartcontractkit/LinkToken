pragma solidity ^0.4.11;


import '../token/ERC20.sol';


contract LinkReceiver {

  bool public callbackCalled;
  uint public tokensReceived;


  function callbackWithoutWithdrawl()
  public
  {
    callbackCalled = true;
  }

  function callbackWithWithdrawl(uint _value)
  public
  {
    callbackCalled = true;
    tokensReceived = _value;
    ERC20 token = ERC20(msg.sender);
    token.transferFrom(tx.origin, this, _value);
  }


}
