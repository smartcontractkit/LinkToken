pragma solidity ^0.4.8;

import "./ERC20.sol";

contract ERC223 is ERC20 {
  function transfer(address to, uint value, bytes data) returns (bool success);
  function unsafeTransfer(address _to, uint _value) returns (bool success);
}
