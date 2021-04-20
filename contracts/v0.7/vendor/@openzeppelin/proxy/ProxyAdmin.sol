// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import { ProxyAdmin as OZ_ProxyAdmin } from "@openzeppelin/contracts/proxy/ProxyAdmin.sol";

/**
 * @dev This is an auxiliary contract meant to be assigned as the admin of a {TransparentUpgradeableProxy}.
 *
 * We force the toolchain to compile an external contract, by bringing in into our codebase like this.
 * For more information see the parent OZ {ProxyAdmin} contract.
 */
contract ProxyAdmin is OZ_ProxyAdmin {}
