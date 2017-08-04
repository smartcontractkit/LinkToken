pragma solidity ^0.4.11;


import '../token/ERC20.sol';
import '../ERC677Receiver.sol';


contract LinkReceiver is ERC677Receiver {

  bool public fallbackCalled;
  bool public callDataCalled;
  uint public tokensReceived;
  uint public lastTransferAmount;
  address public lastTransferSender;


  function tokenFallback(address _from, uint _amount, bytes _data)
  public returns (bool success) {
    fallbackCalled = true;
    if (_data.length > 0) {
      require(address(this).delegatecall(_data, msg.sender, _from, _amount));
    }
    return true;
  }

  function receiveApproval(
    address _from,
    uint256 _amount,
    address _token,
    bytes _data
  )
  public returns (bool _success)
  {
    fallbackCalled = true;
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
    fallbackCalled = true;
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

  function callbackWithoutWithdrawl(address _token, address _from, uint _amount) {
    callDataCalled = true;
  }

  function callbackWithWithdrawl(uint _value, address _from, address _token) {
    callDataCalled = true;
    ERC20 token = ERC20(_token);
    token.transferFrom(_from, this, _value);
    tokensReceived = _value;
  }

}
