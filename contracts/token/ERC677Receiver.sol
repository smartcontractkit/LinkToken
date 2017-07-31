pragma solidity ^0.4.11;


/**
 * @title ERC677Receiver interface
 * @dev interface for a contract to receive contracts from another contract
 */
contract ERC677Receiver {
  function receiveApproval(address from, uint256 _amount, address _token, bytes _data) returns (bool _success);
}
