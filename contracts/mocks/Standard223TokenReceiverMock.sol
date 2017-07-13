pragma solidity ^0.4.8;


import "../token/Standard223Receiver.sol";


contract Standard223TokenReceiverMock is Standard223Receiver {
    address public tokenSender;
    uint public sentValue;
    bytes public tokenData;
    bool public calledFallback = false;

    function tokenFallback(address _sender, uint _value, bytes _data)
    public returns (bool success) {
      calledFallback = true;

      tokenSender = _sender;
      sentValue = _value;
      tokenData = _data;
      return true;
    }

}
