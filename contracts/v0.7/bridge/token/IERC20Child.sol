// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/* Interface Imports */
import { IERC20 } from "../../../vendor/@openzeppelin/contracts/3.4.1/contracts/token/ERC20/IERC20.sol";

/// @dev Interface of the child ERC20 token, for use on sidechains and L2 networks.
interface IERC20Child is IERC20 {
  /**
   * @notice called by bridge gateway when tokens are deposited on root chain
   * Should handle deposits by minting the required amount for the recipient
   *
   * @param recipient an address for whom deposit is being done
   * @param amount total amount to deposit/mint
   */
  function deposit(
    address recipient,
    uint256 amount
  )
    external;

  /**
   * @notice called by bridge gateway when tokens are withdrawn back to root chain
   * @dev Should burn recipient's tokens.
   *
   * @param amount total amount to withdraw/burn
   */
  function withdraw(
    uint256 amount
  )
    external;
}
