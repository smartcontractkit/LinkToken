// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../ERC677.sol";

contract Token677 is ERC20, ERC677 {
  string private constant NAME = "Example ERC677 Token";
  string private constant SYMBOL = "ERC677";

  constructor(
    uint initialBalance
  )
    ERC20(NAME, SYMBOL)
    public
  {
    _mint(msg.sender, initialBalance);
  }
}
