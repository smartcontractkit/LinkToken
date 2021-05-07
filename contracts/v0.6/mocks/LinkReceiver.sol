// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import "../../vendor/@openzeppelin/contracts/3.4.1/contracts/token/ERC20/IERC20.sol";

contract LinkReceiver {
  bool public fallbackCalled;
  bool public callDataCalled;
  uint public tokensReceived;

  function onTokenTransfer(
    address /* from */,
    uint /* amount */,
    bytes memory data
  )
   public
   returns (bool)
  {
    fallbackCalled = true;
    if (data.length > 0) {
      (bool success, /* bytes memory returnData */) = address(this).delegatecall(data);
      require(success, "onTokenTransfer:delegatecall failed");
    }
    return true;
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
