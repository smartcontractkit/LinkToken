pragma solidity ^0.4.8;


contract Token223ReceiverMock {
    address public tokenSender;
    uint public sentValue;
    bytes public tokenData;
    bool public calledFallback = false;

    function tokenFallback(address _sender, uint _value, bytes _data)
    public {
      calledFallback = true;

      tokenSender = _sender;
      sentValue = _value;
      tokenData = _data;
    }

}
