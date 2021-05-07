// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import "../../vendor/@openzeppelin/contracts/3.4.1/contracts/token/ERC20/ERC20.sol";
import "../token/LinkERC20.sol";

contract StandardTokenMock is ERC20, LinkERC20 {
  constructor(
    address initialAccount,
    uint initialBalance
  )
    ERC20("StandardTokenMock", "STM")
    public
  {
    _mint(initialAccount, initialBalance);
  }
}
