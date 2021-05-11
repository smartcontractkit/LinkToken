// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import "../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "./token/ERC677.sol";
import "./token/ERC677Receiver.sol";

abstract contract ERC677Token is ERC20, ERC677 {
  /**
   * @dev transfer token to a contract address with additional data if the recipient is a contact.
   * @param to The address to transfer to.
   * @param value The amount to be transferred.
   * @param data The extra data to be passed to the receiving contract.
   */
  function transferAndCall(
    address to,
    uint value,
    bytes memory data
  )
    public
    override
    virtual
    returns (bool success)
  {
    super.transfer(to, value);
    emit Transfer(msg.sender, to, value, data);
    if (isContract(to)) {
      contractFallback(to, value, data);
    }
    return true;
  }


  // PRIVATE

  function contractFallback(
    address to,
    uint value,
    bytes memory data
  )
    private
  {
    ERC677Receiver receiver = ERC677Receiver(to);
    receiver.onTokenTransfer(msg.sender, value, data);
  }

  function isContract(
    address addr
  )
    private
    view
    returns (bool hasCode)
  {
    uint length;
    assembly { length := extcodesize(addr) }
    return length > 0;
  }
}
