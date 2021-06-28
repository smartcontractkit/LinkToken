// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/* Interface Imports */
import { ITypeAndVersion } from "../../../../v0.6/ITypeAndVersion.sol";
import { IERC20Avalanche } from "./IERC20Avalanche.sol";

/* Library Imports */
import { Address } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/utils/Address.sol";
import { SafeMath } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/math/SafeMath.sol";

/* Contract Imports */
import { Ownable } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/access/Ownable.sol";
import { ERC20 } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/ERC20Burnable.sol";
import { LinkToken } from "../../../../v0.6/LinkToken.sol";

/// @dev Access controlled mintable & burnable LinkToken, for use on Avalanche network.
contract LinkTokenAvalanche is ITypeAndVersion, IERC20Avalanche, ERC20Burnable, LinkToken, Ownable {
  using SafeMath for uint256;

  struct SwapToken {
    address tokenContract;
    uint256 supply;
  }

  mapping(address => SwapToken) s_swapTokens;
  mapping(uint256 => bool) s_chainIds;

  /**
   * @notice versions:
   *
   * - LinkTokenAvalanche 0.0.1: initial release
   *
   * @inheritdoc ITypeAndVersion
   */
  function typeAndVersion()
    external
    pure
    override(ITypeAndVersion, LinkToken)
    virtual
    returns (string memory)
  {
    return "LinkTokenAvalanche 0.0.1";
  }

  /// @inheritdoc IERC20Avalanche
  function chain_ids(
    uint256 id
  )
    public
    view
    override
    returns (bool)
  {
    return s_chainIds[id];
  }

  /// @inheritdoc IERC20Avalanche
  function mint(
    address to,
    uint256 amount,
    address fee_address,
    uint256 fee_amount,
    bytes32 /* origin_tx_id */
  )
    public
    override
  {
    require(owner() == _msgSender(), "DOES_NOT_HAVE_BRIDGE_ROLE");
    _mint(to, amount);
    if (fee_amount > 0) {
      _mint(fee_address, fee_amount);
    }
  }

  /// @inheritdoc IERC20Avalanche
  function add_supported_chain_id(
    uint256 chain_id
  )
    public
    override
  {
    require(owner() == _msgSender(), "DOES_NOT_HAVE_BRIDGE_ROLE");
    s_chainIds[chain_id] = true;
  }

  /// @inheritdoc IERC20Avalanche
  function unwrap(
    uint256 amount,
    uint256 chain_id
  )
    public
    override
  {
    require(s_chainIds[chain_id] == true, "CHAIN_ID_NOT_SUPPORTED");
    _burn(_msgSender(), amount);
  }

  /// @inheritdoc IERC20Avalanche
  function migrate_bridge_role(
    address new_bridge_role_address
  )
    public
    override
  {
    require(owner() == _msgSender(), "DOES_NOT_HAVE_BRIDGE_ROLE");
    transferOwnership(new_bridge_role_address);
  }

  /// @inheritdoc IERC20Avalanche
  function add_swap_token(
    address contract_address,
    uint256 supply_increment
  )
    public
    override
  {
    require(owner() == _msgSender(), "DOES_NOT_HAVE_BRIDGE_ROLE");
    require(Address.isContract(contract_address), "ADDRESS_IS_NOT_CONTRACT");

    // If the swap token is not already supported, add it with the total supply of supply_increment
    // Otherwise, increment the current supply.
    if (s_swapTokens[contract_address].tokenContract == address(0)) {
      s_swapTokens[contract_address] = SwapToken({
          tokenContract: contract_address,
          supply: supply_increment
      });
    } else {
      s_swapTokens[contract_address].supply =
        s_swapTokens[contract_address].supply.add(supply_increment);
    }
  }

  /// @inheritdoc IERC20Avalanche
  function remove_swap_token(
    address contract_address,
    uint256 supply_decrement
  )
    public
    override
  {
    require(owner() == _msgSender(), "DOES_NOT_HAVE_BRIDGE_ROLE");
    require(Address.isContract(contract_address), "ADDRESS_IS_NOT_CONTRACT");
    require(s_swapTokens[contract_address].tokenContract != address(0), "SWAP_TOKEN_IS_NOT_SUPPORTED");

    // If the decrement is less than the current supply, decrement it from the current supply.
    // Otherwise, if the decrement is greater than or equal to the current supply, delete the mapping value.
    if (s_swapTokens[contract_address].supply > supply_decrement) {
      s_swapTokens[contract_address].supply =
        s_swapTokens[contract_address].supply.sub(supply_decrement);
    } else {
      delete s_swapTokens[contract_address];
    }
  }

  /// @inheritdoc IERC20Avalanche
  function swap(
    address token,
    uint256 amount
  )
    public
    override
  {
    require(Address.isContract(token), "TOKEN_IS_NOT_CONTRACT");
    require(s_swapTokens[token].tokenContract != address(0), "SWAP_TOKEN_IS_NOT_SUPPORTED");
    require(amount <= s_swapTokens[token].supply, "SWAP_AMOUNT_MORE_THAN_ALLOWED_SUPPLY");

    // Update the allowed swap amount.
    s_swapTokens[token].supply = s_swapTokens[token].supply.sub(amount);

    // Burn the old token.
    ERC20Burnable swapToken = ERC20Burnable(s_swapTokens[token].tokenContract);
    swapToken.burnFrom(_msgSender(), amount);

    // Mint the new token.
    _mint(_msgSender(), amount);
  }

  /**
   * @notice WARNING: Will burn tokens, without withdrawing them to the origin chain!
   * To withdraw tokens use the `unwrap` method, which is monitored by the bridge
   *
   * @inheritdoc ERC20Burnable
   */
  function burn(
    uint256 amount
  )
    public
    override
    virtual
  {
    super.burn(amount);
  }

  /**
   * @notice WARNING: Will burn tokens, without withdrawing them to the origin chain!
   * To withdraw tokens use the `unwrap` method, which is monitored by the bridge
   *
   * @inheritdoc ERC20Burnable
   */
  function burnFrom(
    address account,
    uint256 amount
  )
    public
    override
    virtual
  {
    super.burnFrom(account, amount);
  }

  /**
   * @dev Overrides parent contract so no tokens are minted on deployment.
   * @inheritdoc LinkToken
   */
  function _onCreate()
    internal
    override
  {
    s_chainIds[0] = true;
  }

  /// @inheritdoc LinkToken
  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  )
    internal
    override(ERC20, LinkToken)
    virtual
  {
    super._transfer(sender, recipient, amount);
  }

  /// @inheritdoc LinkToken
  function _approve(
    address owner,
    address spender,
    uint256 amount
  )
    internal
    override(ERC20, LinkToken)
    virtual
  {
    super._approve(owner, spender, amount);
  }
}
