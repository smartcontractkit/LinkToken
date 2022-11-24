// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../token/IERC677Receiver.sol";

contract LinkReceiver is IERC677Receiver {
  bool public fallbackCalled;
  bool public callDataCalled;
  uint public tokensReceived;

  function onTokenTransfer(
    address /* from */,
    uint /* amount */,
    bytes memory data
  )
   public
   override
  {
    fallbackCalled = true;
    if (data.length > 0) {
      (bool success, /* bytes memory returnData */) = address(this).delegatecall(data);
      require(success, "onTokenTransfer:delegatecall failed");
    }
  }

  function callbackWithoutWithdrawl()
    public
  {
    callDataCalled = true;
  }

  function callbackWithWithdrawl(
    uint value,
    address from,
    address tokenAddr
  )
    public
  {
    callDataCalled = true;
    IERC20 token = IERC20(tokenAddr);
    token.transferFrom(from, address(this), value);
    tokensReceived = value;
  }
}
