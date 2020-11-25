// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

import "./token/LinkERC20.sol";
import "./ERC677Token.sol";

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
   * @dev Check if recepient is a valid address before transfer
   * @inheritdoc ERC20
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
   * @dev Check if spender is a valid address before approval
   * @inheritdoc ERC20
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

  modifier validAddress(address _recipient)
    virtual
  {
    require(_recipient != address(this), "LinkToken: transfer/approve to this contract address");
    _;
  }
}
