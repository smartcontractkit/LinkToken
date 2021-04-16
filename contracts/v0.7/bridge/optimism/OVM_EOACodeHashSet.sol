// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/* Library Imports */
import { EnumerableSet } from "@openzeppelin/contracts/utils/EnumerableSet.sol";

/* Contract Imports */
import { ConfirmedOwner } from "@chainlink/contracts/src/v0.7/dev/ConfirmedOwner.sol";

/**
 * @dev Abstract helper contract used to keep track of OVM EOA contract set (OVM specific)
 *
 * The OVM implements a basic form of account abstraction. In effect, this means
 * that the only type of account is a smart contract (no EOAs), and all user wallets
 * are in fact smart contract wallets. So to check for EOA, we need to actually check if
 * the sender is an OVM_ProxyEOA contract, which gets deployed by the ovmCREATEEOA opcode.
 *
 * As the OVM_ProxyEOA.sol contract source could potentially change in the future (i.e., due to a fork),
 * here we actually track a set of possible EOA proxy contracts.
 */
abstract contract OVM_EOACodeHashSet is ConfirmedOwner {
  // Add the EnumerableSet library
  using EnumerableSet for EnumerableSet.Bytes32Set;
 
  // Declare a Bytes32Set of code hashes
  EnumerableSet.Bytes32Set private s_codeHasheSet;

  // Declare the genesis OVM_ProxyEOA.sol EXTCODEHASH
  bytes32 constant OVM_EOA_CODE_HASH = 0x93bb081a7dd92bde63b4d0aa9b8612352b2ec585176a80efc0a2a277ecfc010e;

  /// @notice Adds genesis OVM_ProxyEOA.sol EXTCODEHASH to the default set.
  constructor()
    ConfirmedOwner(msg.sender)
  {
    s_codeHasheSet.add(OVM_EOA_CODE_HASH);
  }

  /// @notice Reverts if called by anyone other than whitelisted EOA contracts.
  modifier onlyEOAContract() {
    require(_isEOAContract(msg.sender), "Only callable by whitelisted EOA");
    _;
  }

  /**
   * @dev Returns true if the EOA contract code hash value is in the set. O(1).
   * 
   * @param value EOA contract code hash to check
   */
  function containsEOACodeHash(
    bytes32 value
  )
    public
    view
    returns (bool)
  {
    return s_codeHasheSet.contains(value);
  }

  /**
   * @dev Adds a EOA contract code hash value to the set. O(1).
   * 
   * Returns true if the value was added to the set, that is if it was not already present.
   * @param value EOA contract code hash to add
   */
  function addEOACodeHash(
    bytes32 value
  )
    public
    onlyOwner()
    returns (bool)
  {
    return s_codeHasheSet.add(value);
  }

  /**
   * @dev Removes a EOA contract code hash value from the set. O(1).
   * 
   * Returns true if the value was removed from the set, that is if it was present.
   * @param value EOA contract code hash to remove
   */
  function removeEOACodeHash(
    bytes32 value
  )
    public
    onlyOwner()
    returns (bool)
  {
    return s_codeHasheSet.remove(value);
  }

  /**
   * @dev Returns true if `account` is a whitelisted EOA contract.
   * @param account Address to check
   */
  function _isEOAContract(
    address account
  )
    internal
    view
    returns (bool)
  {
    bytes32 codehash;
    // solhint-disable-next-line no-inline-assembly
    assembly { codehash := extcodehash(account) }
    return s_codeHasheSet.contains(codehash);
  }
}
