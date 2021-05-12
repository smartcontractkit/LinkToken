// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import "../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../token/LinkERC20.sol";

contract Token20 is LinkERC20 {
  string private constant NAME = "Example ERC20 Token";
  string private constant SYMBOL = "ERC20";

  constructor(
    address initialAccount,
    uint initialBalance
  )
    ERC20(NAME, SYMBOL)
    public
  {
    _mint(initialAccount, initialBalance);
  }
}
