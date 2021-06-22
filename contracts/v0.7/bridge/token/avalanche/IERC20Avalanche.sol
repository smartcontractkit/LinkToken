// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/* Interface Imports */
import { IERC20 } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IERC20Avalanche is IERC20 {

  function mint(
    address to,
    uint256 amount,
    address fee_address,
    uint256 fee_amount,
    bytes32 origin_tx_id
  )
    external;

  function chain_ids(uint256 id)
    external
    view
    returns (bool);

  function add_supported_chain_id(
    uint256 chain_id
  )
    external;

  function unwrap(
    uint256 amount,
    uint256 chain_id
  )
    external;

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

  function swap(
    address token,
    uint256 amount
  )
    external;
}
