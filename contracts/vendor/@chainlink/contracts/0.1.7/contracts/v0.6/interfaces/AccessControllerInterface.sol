// SPDX-License-Identifier: MIT
// next-line updated from source
pragma solidity >0.6.0 <0.8.0;

interface AccessControllerInterface {
  function hasAccess(address user, bytes calldata data) external view returns (bool);
}
