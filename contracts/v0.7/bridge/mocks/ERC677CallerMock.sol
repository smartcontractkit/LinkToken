// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/* Interface Imports */
import { IERC677 } from "../../../v0.6/token/IERC677.sol";

contract ERC677CallerMock {
  /// @dev Forward transferAndCall to destination contract
  function callTransferAndCall(
    address destintion,
    address to,
    uint value,
    bytes memory data
  )
    external
  {
    IERC677(destintion).transferAndCall(to, value, data);
  }
}
