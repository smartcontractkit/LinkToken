pragma solidity ^0.4.8;


import "../token/Standard223Receiver.sol";


contract Standard223TokenReceiverMock is Standard223Receiver {
    address public tokenSender;
    uint public sentValue;
    bytes public tokenData;
    bool public calledFallback = false;

    function tokenFallback(address from, uint value, bytes data)
    {
        calledFallback = true;

        tokenSender = from;
        sentValue = value;
        tokenData = data;
    }

}
