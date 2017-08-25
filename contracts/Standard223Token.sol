pragma solidity ^0.4.11;


import "./token/ERC223.sol";
import "./token/ERC223Receiver.sol";
import "./token/StandardToken.sol";


contract Standard223Token is ERC223, StandardToken {

  /**
  * @dev transfer token to a specified address with data.
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  * @param _data The extra data to be passed to the receiving contract.
  */
  function transfer(address _to, uint _value, bytes _data)
  public returns (bool success)
  {
    super.transfer(_to, _value);
    Transfer(msg.sender, _to, _value, _data);
    if (isContract(_to)) {
      contractFallback(_to, _value, _data);
    }
    return true;
  }

  /**
  * @dev transfer token to a specified address.
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
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
  private returns (bool hasCode)
  {
    uint length;
    assembly { length := extcodesize(_addr) }
    return length > 0;
  }
}
