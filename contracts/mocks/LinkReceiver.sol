pragma solidity ^0.4.11;


import '../token/ERC20.sol';
import '../token/ERC677Receiver.sol';


contract LinkReceiver is ERC677Receiver {

  bool public callbackCalled;
  bool public callDataCalled;
  uint public tokensReceived;
  uint public lastTransferAmount;
  address public lastTransferSender;

  function receiveApproval(
    address _from,
    uint256 _amount,
    address _token,
    bytes _data
  )
  public returns (bool _success)
  {
    callbackCalled = true;
    if (_data.length > 0) {
      require(this.call(_data));
    }
    return true;
  }

  function receiveTokenTransfer(
    address _from,
    uint256 _amount,
    bytes _data
  )
  public returns (bool _success)
  {
    callbackCalled = true;
    lastTransferSender = _from;
    lastTransferAmount = _amount;
    if (_data.length > 0) {
      require(this.call(_data));
    }
    return true;
  }

  function callbackWithoutWithdrawl() {
    callDataCalled = true;
  }

  function callbackWithWithdrawl(uint _value, address _from, address _token) {
    callDataCalled = true;
    ERC20 token = ERC20(_token);
    token.transferFrom(_from, this, _value);
    tokensReceived = _value;
  }

}
