// SPDX-License-Identifier: MIT
pragma solidity >0.5.0 <0.8.0;

/**
 * @title OVM_Address
 */
library OVM_Address {

  // OVM_ProxyEOA.sol EXTCODEHASH
  bytes32 constant OVM_EOA_CODEHASH = 0xb01e6526abeb73cf7701ba03da7d294a507b32214304ade7f8b6b7923c806cc8;

  /**
   * @dev Returns true if `account` is a an OVM_ProxyEOA.sol contract.
   * @param account Address to check
   */
  function isEOAContract(
    address account
  )
    internal
    view
    returns (bool)
  {
    // The OVM implements a basic form of account abstraction. In effect, this means
    // that the only type of account is a smart contract (no EOAs), and all user wallets
    // are in fact smart contract wallets. So to check for EOA, here we actually check if
    // the sender is an OVM_ProxyEOA contract, which gets deployed by the ovmCREATEEOA opcode.
    bytes32 codehash;
    // solhint-disable-next-line no-inline-assembly
    assembly { codehash := extcodehash(account) }
    return codehash == OVM_EOA_CODEHASH;
  }

  /**
   * @dev Returns true if `account` is empty.
   * @param account Address to check
   */
  function isEmptyAccount(
    address account
  )
    internal
    view
    returns (bool)
  {
    bytes32 codehash;
    // solhint-disable-next-line no-inline-assembly
    assembly { codehash := extcodehash(account) }
    return codehash == bytes32(0);
  }
}
