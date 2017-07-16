pragma solidity ^0.4.11;


/**
 * @title ApproveAndCallReceiver interface
 * @dev interface for a contract to receive contracts from another contract
 */
contract ApproveAndCallReceiver {
  function receiveApproval(address from, uint256 _amount, address _token, bytes _data) returns (bool _success);
}
