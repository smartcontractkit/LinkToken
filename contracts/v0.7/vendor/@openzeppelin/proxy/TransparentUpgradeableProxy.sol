// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import { TransparentUpgradeableProxy as OZ_TransparentUpgradeableProxy } from "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";

/**
 * @dev This contract implements a proxy that is upgradeable by an admin.
 *
 * We force the toolchain to compile an external contract, by bringing in into our codebase like this.
 * For more information see the parent OZ {TransparentUpgradeableProxy} contract.
 */
contract TransparentUpgradeableProxy is OZ_TransparentUpgradeableProxy {

  /**
   * @dev Initializes an upgradeable proxy managed by `_admin`, backed by the implementation at `_logic`, and
   * optionally initialized with `_data` as explained in {UpgradeableProxy-constructor}.
   */
  constructor(
    address _logic,
    address _admin,
    bytes memory _data
  )
    public
    payable
    OZ_TransparentUpgradeableProxy(_logic, _admin, _data)
  {}
}
