// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/* Interface Imports */
import { IERC20 } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import { IERC165 } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/introspection/IERC165.sol";

/// @dev Interface for the bridged ERC20 token expected by the Optimism standard bridge L2 gateway.
interface IERC20Optimism is IERC20, IERC165 {
  /// @dev Returns the address of an L1 token contract linked to this L2 token contract
  function l1Token()
    external
    returns (address);

  /**
   * @dev Creates `_amount` tokens `_to` account.
   * @notice Called by L2 gateway to deposit tokens.
   * @param _to Address of the recipient.
   * @param _amount Number of tokens to mint.
   */
  function mint(
    address _to,
    uint256 _amount
  )
    external;

  /**
   * @dev Destroys `_amount` tokens `_from` account.
   * @notice Called by L2 gateway to withdraw tokens.
   * @param _from Address of the account holding the tokens to be burnt.
   * @param _amount Number of tokens to burn.
   */
  function burn(
    address _from,
    uint256 _amount
  )
    external;

  /// @dev Emitted when `_amount` tokens are deposited from L1 to L2.
  event Mint(
    address indexed _account,
    uint256 _amount
  );

  /// @dev Emitted when `_amount` tokens are withdrawn from L2 to L1.
  event Burn(
    address indexed _account,
    uint256 _amount
  );
}
