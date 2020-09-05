pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract StandardTokenMock is ERC20 {

  constructor(address initialAccount, uint initialBalance) ERC20("StandardTokenMock", "STM") public {
    _mint(initialAccount, initialBalance);
  }

  /**
   * @dev Atomically increases the allowance granted to `spender` by the caller.
   *
   * This is an alternative to {approve} that can be used as a mitigation for
   * problems described in {IERC20-approve}.
   *
   * Emits an {Approval} event indicating the updated allowance.
   *
   * Requirements:
   *
   * - `spender` cannot be the zero address.
   */
  function increaseApproval(address spender, uint256 addedValue) public virtual returns (bool) {
      return super.increaseAllowance(spender, addedValue);
  }

  /**
   * @dev Atomically decreases the allowance granted to `spender` by the caller.
   *
   * This is an alternative to {approve} that can be used as a mitigation for
   * problems described in {IERC20-approve}.
   *
   * Emits an {Approval} event indicating the updated allowance.
   *
   * Requirements:
   *
   * - `spender` cannot be the zero address.
   * - `spender` must have allowance for the caller of at least
   * `subtractedValue`.
   */
  function decreaseApproval(address spender, uint256 subtractedValue) public virtual returns (bool) {
      return super.decreaseAllowance(spender, subtractedValue);
  }
}
