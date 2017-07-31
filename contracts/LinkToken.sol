pragma solidity ^0.4.11;


import './token/StandardToken.sol';
import './token/ERC20.sol';
import './token/ERC677Receiver.sol';


contract LinkToken is StandardToken {

  uint public constant totalSupply = 10**18;
  string public constant name = 'ChainLink Token';
  uint8 public constant decimals = 9;
  string public constant symbol = 'LINK';

  function LinkToken()
  public
  {
    balances[msg.sender] = totalSupply;
  }

  /**
  * @dev transfer token for a specified address.
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint _value)
  public validRecipient(_to) returns (bool success)
  {
    super.transfer(_to, _value);
  }

  /**
   * @dev Aprove the passed address to transfer the specified amount of tokens, and then call the address with the given bytes.
   * @param _receiver The address which will be allowed access to transfer the tokens.
   * @param _value The amount of tokens allowed to be transfered from the transaction sender.
   * @param _data The bytes to be executed at the recipient's address after transfer approval.
   */
  function approveAndCall(address _receiver, uint _value, bytes _data)
  public returns (bool success)
  {
    approve(_receiver, _value);
    ERC677Receiver receiver = ERC677Receiver(_receiver);
    return receiver.receiveApproval(msg.sender, _value, this, _data);
  }

  function transferAndCall(address _receiver, uint _value, bytes _data)
  public returns (bool success)
  {
    transfer(_receiver, _value);
    ERC677Receiver receiver = ERC677Receiver(_receiver);
    return receiver.receiveTokenTransfer(msg.sender, _value, _data);
  }


  // MODIFIERS

  modifier validRecipient(address _recipient) {
    require(_recipient != address(0) && _recipient != address(this));
    _;
  }

}
