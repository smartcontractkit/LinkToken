pragma solidity ^0.6.0;

import "@chainlink/contracts/src/v0.6/Owned.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./token/ERC677.sol";

contract SimpleSwap is Owned {
  using SafeMath for uint256;

  mapping(address => mapping(address => uint256)) private s_swappableAmount;

  function addLiquidity(
    uint256 amount,
    address source,
    address target
  )
    external
  {
    uint256 current = swappable(source, target);
    s_swappableAmount[source][target] = current.add(amount);

    require(ERC20(target).transferFrom(msg.sender, address(this), amount), "transferFrom failed");
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

  function swap(
    uint256 amount,
    address source,
    address target
  )
    external
  {
    uint256 availableTarget = swappable(source, target);
    s_swappableAmount[source][target] = availableTarget.sub(amount);
    require(amount <= availableTarget, "not enough liquidity");

    uint256 availableSource = swappable(target, source);
    s_swappableAmount[target][source] = availableSource.add(amount);

    require(ERC20(source).transferFrom(msg.sender, address(this), amount), "transferFrom failed");
    require(ERC20(target).transfer(msg.sender, amount), "transfer failed");
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
