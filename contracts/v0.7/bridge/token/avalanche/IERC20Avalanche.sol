// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/* Interface Imports */
import { IERC20 } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// @dev Interface for the bridged ERC20 token expected by the Avalanche standard bridge.
interface IERC20Avalanche is IERC20 {

  function mint(
    address to,
    uint256 amount,
    address fee_address,
    uint256 fee_amount,
    bytes32 origin_tx_id
  )
    external;

  function chain_ids(
    uint256 id
  )
    external
    view
    returns (bool);

  function add_supported_chain_id(
    uint256 chain_id
  )
    external;

  /**
   * @dev Destroys `amount` tokens from `msg.sender. This function is monitored by the Avalanche bridge.
   * @notice Call this when withdrawing tokens from Avalanche (NOT the direct `burn/burnFrom` method!).
   * @param amount Number of tokens to unwrap.
   * @param chain_id Id of the chain/network where to withdraw tokens.
   */
  function unwrap(
    uint256 amount,
    uint256 chain_id
  )
    external;

  /**
   * @dev Transfers bridge role from `msg.sender` to `new_bridge_role_address`.
   * @param new_bridge_role_address Address of the new bridge operator.
   */
  function migrate_bridge_role(
    address new_bridge_role_address
  )
    external;

  function add_swap_token(
    address contract_address,
    uint256 supply_increment
  )
    external;

  function remove_swap_token(
    address contract_address,
    uint256 supply_decrement
  )
    external;

  /**
   * @param token Address of the token to swap.
   * @param amount Number of tokens to swap.
   */
  function swap(
    address token,
    uint256 amount
  )
    external;
}
