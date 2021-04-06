// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/**
 * @title OVM_CrossDomainMessengerMock
 *
 * Compiler used: optimistic-solc
 * Runtime target: OVM
 */
contract OVM_CrossDomainMessengerMock {

  /**
   * Sends a cross domain message to the target messenger.
   * @param _target Target contract address.
   * @param _message Message to send to the target.
   * @param _gasLimit Gas limit for the provided message.
   */
  function sendMessage(
    address _target,
    bytes memory _message,
    uint32 _gasLimit
  )
    public
  {
    // noop
  }
}
