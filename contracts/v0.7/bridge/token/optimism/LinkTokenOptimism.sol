// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/* Interface Imports */
import { IERC165 } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/introspection/IERC165.sol";
import { ITypeAndVersion } from "../../../../v0.6/ITypeAndVersion.sol";
import { IERC20Optimism } from "./IERC20Optimism.sol";

/* Contract Imports */
import { ERC20 } from "../../../../../vendor/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import { LinkToken } from "../../../../v0.6/LinkToken.sol";

/// @dev Access controlled mintable & burnable LinkToken, for use on Optimism L2 network.
contract LinkTokenOptimism is ITypeAndVersion, IERC20Optimism, LinkToken {
  /// @dev Returns the address of an L2 bridge contract that has access to mint & burn
  address public immutable l2Bridge;
  /// @inheritdoc IERC20Optimism
  address public immutable override l1Token;

  /**
   * @dev Creates an L2 token connected to a specific L2 bridge gateway & L1 token
   * @param l2BridgeAddr Address of the corresponding L2 bridge gateway.
   * @param l1TokenAddr Address of the corresponding L1 token.
   */
  constructor(
    address l2BridgeAddr,
    address l1TokenAddr
  ) {
    l2Bridge = l2BridgeAddr;
    l1Token = l1TokenAddr;
  }

  /**
   * @notice versions:
   *
   * - LinkTokenOptimism 0.0.1: initial release
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
    return "LinkTokenOptimism 0.0.1";
  }

  /// @dev Checks that message sender is the L2 bridge contract (locked access to mint & burn)
  modifier onlyL2Bridge {
    require(msg.sender == l2Bridge, "Only L2 Bridge can mint and burn");
    _;
  }

  /**
   * @dev Optimism standard bridge L2 gateway uses ERC165 to confirm the required interface
   * @inheritdoc IERC165
   */
  function supportsInterface(
    bytes4 interfaceId
  )
    public
    override
    pure
    returns (bool)
  {
    bytes4 firstSupportedInterface = bytes4(keccak256("supportsInterface(bytes4)")); // ERC165
    bytes4 secondSupportedInterface = IERC20Optimism.l1Token.selector
      ^ IERC20Optimism.mint.selector
      ^ IERC20Optimism.burn.selector;
    return interfaceId == firstSupportedInterface || interfaceId == secondSupportedInterface;
  }

  /// @inheritdoc IERC20Optimism
  function mint(
    address _to,
    uint256 _amount
  )
    public
    override
    onlyL2Bridge()
  {
    _mint(_to, _amount);
    emit Mint(_to, _amount);
  }

  /// @inheritdoc IERC20Optimism
  function burn(
    address _from,
    uint256 _amount
  )
    public
    override
    onlyL2Bridge()
  {
    _burn(_from, _amount);
    emit Burn(_from, _amount);
  }

  /**
   * @dev Overrides parent contract so no tokens are minted on deployment.
   * @inheritdoc LinkToken
   */
  function _onCreate()
    internal
    override
  {}
}
