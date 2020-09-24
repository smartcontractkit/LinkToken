pragma solidity ^0.6.0;

import './token/LinkERC20.sol';
import './ERC677Token.sol';

contract LinkToken is LinkERC20, ERC677Token {
  uint private constant TOTAL_SUPPLY = 10**27;
  string private constant NAME = 'ChainLink Token';
  string private constant SYMBOL = 'LINK';

  constructor() ERC20(NAME, SYMBOL)
    public
  {
    _onCreate();
  }

  /**
   * @dev Hook that is called when this contract is created.
   * Useful to override constructor behaviour in child contracts (e.g., LINK bridge tokens).
   * @notice Default implementation mints 10**27 tokens to msg.sender
   */
  function _onCreate()
    internal
    virtual
  {
    _mint(msg.sender, TOTAL_SUPPLY);
  }

  /**
   * @dev Moves tokens `amount` from `sender` to `recipient`.
   *
   * This is internal function is equivalent to {transfer}, and can be used to
   * e.g. implement automatic token fees, slashing mechanisms, etc.
   *
   * Emits a {Transfer} event.
   *
   * Requirements:
   *
   * - `sender` cannot be the zero address.
   * - `recipient` cannot be the zero address.
   * - `sender` must have a balance of at least `amount`.
   */
  function _transfer(address sender, address recipient, uint256 amount)
    internal
    override
    virtual
    validAddress(recipient)
  {
    super._transfer(sender, recipient, amount);
  }

  /**
   * @dev Sets `amount` as the allowance of `spender` over the `owner`s tokens.
   *
   * This is internal function is equivalent to `approve`, and can be used to
   * e.g. set automatic allowances for certain subsystems, etc.
   *
   * Emits an {Approval} event.
   *
   * Requirements:
   *
   * - `owner` cannot be the zero address.
   * - `spender` cannot be the zero address.
   */
  function _approve(address owner, address spender, uint256 amount)
    internal
    override
    virtual
    validAddress(spender)
  {
    super._approve(owner, spender, amount);
  }


  // MODIFIERS

  modifier validAddress(address _recipient) {
    require(_recipient != address(this), "LinkToken: transfer/approve to this contract address");
    _;
  }
}
