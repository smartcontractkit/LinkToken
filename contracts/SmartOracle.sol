pragma solidity ^0.4.4;

contract SmartOracle {

  address public owner;

  function SmartOracle() {
    owner = msg.sender;
  }

}
