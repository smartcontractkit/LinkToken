pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LinkReceiver {
  bool public fallbackCalled;
  bool public callDataCalled;
  uint public tokensReceived;

  function onTokenTransfer(address _from, uint _amount, bytes memory _data) public returns (bool) {
    fallbackCalled = true;
    if (_data.length > 0) {
      (bool success, bytes memory _returnData) = address(this).delegatecall(_data);
      require(success, "onTokenTransfer:delegatecall failed");
    }
    return true;
  }

  function callbackWithoutWithdrawl() public {
    callDataCalled = true;
  }

  function callbackWithWithdrawl(uint _value, address _from, address _token) public {
    callDataCalled = true;
    IERC20 token = IERC20(_token);
    token.transferFrom(_from, address(this), _value);
    tokensReceived = _value;
  }
}
