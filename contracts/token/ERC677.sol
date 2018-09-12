pragma solidity ^0.4.8;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract ERC677 is ERC20 {
  function transferAndCall(address to, uint value, bytes data) returns (bool success);

  event Transfer(address indexed from, address indexed to, uint value, bytes data);
}
