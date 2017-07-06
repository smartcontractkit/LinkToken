pragma solidity ^0.4.8;

import "./ERC20.sol";

contract ERC223 is ERC20 {
  function transfer(address to, uint value, bytes data);
  function transferFrom(address from, address to, uint value, bytes data);
}
