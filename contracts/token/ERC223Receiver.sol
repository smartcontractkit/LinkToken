pragma solidity ^0.4.8;


contract ERC223Receiver {
  function tokenFallback(address _sender, uint _value, bytes _data) returns (bool success);
}
