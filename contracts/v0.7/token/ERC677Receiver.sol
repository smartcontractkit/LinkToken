// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

interface ERC677Receiver {
  function onTokenTransfer(address _sender, uint _value, bytes memory _data) external;
}
