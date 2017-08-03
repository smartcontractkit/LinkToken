pragma solidity ^0.4.11;


import "../token/Standard223Receiver.sol";


contract Token223Receiver is Standard223Receiver {
    event LogFallbackParameters(address from, uint value, bytes data);

    function tokenFallback(address from, uint value, bytes data)
    public returns (bool success)
    {
        LogFallbackParameters(from, value, data);
    }
}
