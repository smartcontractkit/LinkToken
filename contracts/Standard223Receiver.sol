pragma solidity ^0.4.8;

 /* ERC223 additions to ERC20 */

import "./token/ERC223Receiver.sol";

contract Standard223Receiver is ERC223Receiver {
  ReceivedToken receivedToken;

  struct ReceivedToken {
    address addr;
    address sender;
    uint256 value;
    bytes data;
    bytes4 sig;
  }

  function tokenFallback(address _sender, uint _value, bytes _data)
  public returns (bool success) {
    __isTokenFallback = true;
    if (!address(this).delegatecall(_data)) throw;
    __isTokenFallback = false;
    return true;
  }


  // PRIVATE

  bool private __isTokenFallback;

  function getSig(bytes _data)
  private returns (bytes4 sig) {
    uint l = _data.length < 4 ? _data.length : 4;
    for (uint i = 0; i < l; i++) {
      sig = bytes4(uint(sig) + uint(_data[i]) * (2 ** (8 * (l - 1 - i))));
    }
  }

  modifier tokenPayable {
    if (!__isTokenFallback) throw;
    _;
  }
}
