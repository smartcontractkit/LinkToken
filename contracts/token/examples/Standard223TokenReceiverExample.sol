pragma solidity ^0.4.11;


import "../Standard223Receiver.sol";


contract Standard223TokenReceiverExample is Standard223Receiver {
    event LogFallbackParameters(address from, uint value, bytes data);

    function tokenFallback(address from, uint value, bytes data)
    {
        LogFallbackParameters(from, value, data);
    }
}
