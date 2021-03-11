pragma solidity ^0.6.0;

import "@chainlink/contracts/src/v0.6/Owned.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./token/ERC677.sol";

contract SimpleSwap is Owned, ReentrancyGuard {
  using SafeMath for uint256;

  mapping(address => mapping(address => uint256)) s_swappableAmount;

  function addLiquidity(
    address source,
    address target
  )
    external
    nonReentrant()
  {
    uint256 allowance = ERC20(target).allowance(msg.sender, address(this));

    uint256 current = swappable(source, target);
    s_swappableAmount[source][target] = current.add(allowance);

    bool success = ERC20(target).transferFrom(msg.sender, address(this), allowance);
    require(success, "transferFrom failed");
  }

  function removeLiquidity(
    uint256 amount,
    address source,
    address target
  )
    external
    onlyOwner()
  {
    uint256 current = swappable(source, target);
    s_swappableAmount[source][target] = current.sub(amount);

    bool success = ERC20(target).transfer(msg.sender, amount);
    require(success, "transfer failed");
  }

  function swappable(
    address source,
    address target
  )
    public
    view
    returns(uint256 total)
  {
    return s_swappableAmount[source][target];
  }


}
