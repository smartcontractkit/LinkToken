// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/* Interface Imports */
import { IERC20 } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import { IERC165 } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/introspection/IERC165.sol";

/// @dev Interface for L2 ERC20 tokens expected by the Optimism standard bridge L2 gateway.
interface IERC20Optimism is IERC20, IERC165 {
  /// @dev Returns the address of an L1 token contract linked to this L2 token contract
  function l1Token()
    external
    returns (address);

  /**
   * @dev Creates `amount` tokens `to` account.
   * @notice Called by L2 gateway to deposit tokens.
   */
  function mint(
    address to,
    uint256 amount
  )
    external;

  /**
   * @dev Destroys `amount` tokens `from` account.
   * @notice Called by L2 gateway to withdraw tokens.
   */
  function burn(
    address from,
    uint256 amount
  )
    external;

  /// @dev Emitted when `amount` tokens are deposited from L1 to L2.
  event Mint(
    address indexed account,
    uint256 amount
  );

  /// @dev Emitted when `amount` tokens are withdrawn from L2 to L1.
  event Burn(
    address indexed account,
    uint256 amount
  );
}
