// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

interface IERC677Receiver {
  function onTokenTransfer(
    address sender,
    uint value,
    bytes memory data
  )
    external;
}
