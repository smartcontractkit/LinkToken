pragma solidity ^0.4.11;


import '../token/ERC20.sol';
import '../token/ERC677Receiver.sol';


contract LinkReceiver is ERC677Receiver {

  bool public callbackCalled;
  bool public callDataCalled;
  uint public tokensReceived;

  function receiveApproval(
    address _from, uint256 _amount, address _token, bytes _data)
  public returns (bool _success)
  {
    callbackCalled = true;
    if (_data.length > 0) {
      require(this.call(_data));
    }
    return true;
  }


  function callbackWithoutWithdrawl()
  public
  {
    callDataCalled = true;
  }

  function callbackWithWithdrawl(uint _value, address _from, address _token)
  public
  {
    callDataCalled = true;
    ERC20 token = ERC20(_token);
    token.transferFrom(_from, this, _value);
    tokensReceived = _value;
  }


}
