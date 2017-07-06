pragma solidity ^0.4.8;

 /* ERC223 additions to ERC20 */

import "./ERC223Receiver.sol";

contract Standard223Receiver is ERC223Receiver {
  ReceivedToken receivedToken;

  struct ReceivedToken {
    address addr;
    address sender;
    uint256 value;
    bytes data;
    bytes4 sig;
  }

  function tokenFallback(address _sender, uint _value, bytes _data) {
    __isTokenFallback = true;
    receivedToken = ReceivedToken(msg.sender, _sender, _value, _data, getSig(_data));
    if (!address(this).delegatecall(_data)) throw;
    /* receivedToken = ReceivedToken(); */
    __isTokenFallback = false;
  }

  function getSig(bytes _data) private returns (bytes4 sig) {
    uint l = _data.length < 4 ? _data.length : 4;
    for (uint i = 0; i < l; i++) {
      sig = bytes4(uint(sig) + uint(_data[i]) * (2 ** (8 * (l - 1 - i))));
    }
  }

  bool __isTokenFallback;

  modifier tokenPayable {
    if (!__isTokenFallback) throw;
    _;
  }
}
