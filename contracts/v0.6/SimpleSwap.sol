pragma solidity ^0.6.0;

import "@chainlink/contracts/src/v0.6/Owned.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract SimpleSwap is Owned {
  using SafeMath for uint256;

  event LiquidityUpdated(
    uint256 indexed amount,
    address indexed source,
    address indexed target
  );
  event TokensSwapped(
    uint256 amount,
    address indexed source,
    address indexed target,
    address caller
  );

  mapping(address => mapping(address => uint256)) private s_swappableAmount;

  function addLiquidity(
    uint256 amount,
    address source,
    address target
  )
    external
  {
    uint256 current = getSwappableAmount(source, target);
    uint256 newAmount = current.add(amount);
    s_swappableAmount[source][target] = newAmount;
    emit LiquidityUpdated(newAmount, source, target);

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
    uint256 current = getSwappableAmount(source, target);
    uint256 newAmount = current.sub(amount);
    s_swappableAmount[source][target] = newAmount;
    emit LiquidityUpdated(newAmount, source, target);

    require(ERC20(target).transfer(msg.sender, amount), "transfer failed");
  }

  function swap(
    uint256 amount,
    address source,
    address target
  )
    external
  {
    uint256 availableTarget = getSwappableAmount(source, target);
    require(amount <= availableTarget, "not enough liquidity");

    uint256 newTargetAmount = availableTarget.sub(amount);
    s_swappableAmount[source][target] = newTargetAmount;
    emit LiquidityUpdated(newTargetAmount, source, target);

    uint256 newSourceAmount = getSwappableAmount(target, source).add(amount);
    s_swappableAmount[target][source] = newSourceAmount;
    emit LiquidityUpdated(newSourceAmount, source, target);

    emit TokensSwapped(amount, source, target, msg.sender);

    require(ERC20(source).transferFrom(msg.sender, address(this), amount), "transferFrom failed");
    require(ERC20(target).transfer(msg.sender, amount), "transfer failed");
  }

  function getSwappableAmount(
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
