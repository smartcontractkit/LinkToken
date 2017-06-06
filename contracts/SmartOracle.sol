pragma solidity ^0.4.8;

contract SmartOracle {

  address public owner;

  function SmartOracle() {
    owner = msg.sender;
  }

}
