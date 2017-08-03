pragma solidity ^0.4.8;


import "./ERC223.sol";
import "./ERC223Receiver.sol";
import "./StandardToken.sol";


contract Standard223Token is ERC223, StandardToken {

  function transfer(address _to, uint _value, bytes _data)
  public returns (bool success)
  {
    super.transfer(_to, _value);
    if (isContract(_to))
      contractFallback(_to, _value, _data);
    return true;
  }

  function transfer(address _to, uint _value)
  public returns (bool success)
  {
    return transfer(_to, _value, new bytes(0));
  }

  // PRIVATE

  function contractFallback(address _to, uint _value, bytes _data)
  private
  {
    ERC223Receiver reciever = ERC223Receiver(_to);
    reciever.tokenFallback(msg.sender, _value, _data);
  }

  function isContract(address _addr)
  private returns (bool isContract)
  {
    uint length;
    assembly { length := extcodesize(_addr) }
    return length > 0;
  }
}
