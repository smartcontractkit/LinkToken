// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

contract Token677ReceiverMock {
  address public tokenSender;
  uint public sentValue;
  bytes public tokenData;
  bool public calledFallback = false;

  function onTokenTransfer(
    address sender,
    uint value,
    bytes memory data
  )
    public
  {
    calledFallback = true;

    tokenSender = sender;
    sentValue = value;
    tokenData = data;
  }
}
