pragma solidity ^0.4.11;

import "../Standard223Receiver.sol";

contract Standard223TokenReceiverExample is Standard223Receiver {
    function tokenFallback(address from, uint value, bytes data){
        LogFallbackParameters(from, value, data);
    }
    event LogFallbackParameters(address from, uint value, bytes data);
}
