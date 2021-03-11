pragma solidity ^0.6.0;

import "@chainlink/contracts/src/v0.6/Owned.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./token/ERC677.sol";

contract SimpleSwap is Owned, ReentrancyGuard {
  using SafeMath for uint256;

  mapping(address => mapping(address => uint256)) s_swappableAmount;

  constructor()
    public
    Owned()
  { }

  function addSwappableTokens(
    address source,
    address destination
  )
    external
    onlyOwner()
    nonReentrant()
  {
    ERC20 destinationToken = ERC20(destination);
    uint256 allowance = destinationToken.allowance(msg.sender, address(this));

    uint256 current = swappable(source, destination);
    s_swappableAmount[source][destination] = current.add(allowance);

    bool success = destinationToken.transferFrom(msg.sender, address(this), allowance);
    require(success, "transferFrom failed");
  }

  function swappable(
    address source,
    address destination
  )
    public
    view
    returns(uint256 total)
  {
    return s_swappableAmount[source][destination];
  }


}
