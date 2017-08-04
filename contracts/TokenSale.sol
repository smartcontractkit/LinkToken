pragma solidity ^0.4.11;


import './Ownable.sol';
import './math/SafeMath.sol';
import './LinkToken.sol';


contract TokenSale is Ownable {

  using SafeMath for uint;

  uint public limit;
  uint public startTime;
  uint public distributed;
  uint constant public phase1End = 1 days;
  uint constant public phase2End = 7 days;
  uint constant public phase3End = 14 days;
  uint constant public phase4End = 21 days;
  uint constant public endTime = 28 days;
  address public recipient;
  address public distributionUpdater;
  LinkToken public token;

  function TokenSale(
    uint _limit,
    uint _prePurchased,
    uint _start,
    address _owner,
    address _distributionUpdater
  )
  public
  {
    limit = _limit;
    distributed = _prePurchased;
    startTime = _start;
    token = new LinkToken();
    owner = _owner;
    distributionUpdater = _distributionUpdater;

    require(limit <= token.totalSupply());
  }

  function ()
  public payable
  {
    purchase(msg.sender);
  }

  function purchase(address _recipient)
  public payable ensureStarted ensureNotCompleted
  {
    uint purchaseAmount = calculatePurchased();

    require(underLimit(purchaseAmount) && owner.send(msg.value));

    distributed = distributed.add(purchaseAmount);
    token.transfer(_recipient, purchaseAmount);
  }

  function completed()
  public constant returns (bool)
  {
    return ended() || funded() || finalized;
  }

  function closeOut()
  public onlyOwner ensureStarted ensureCompleted
  {
    token.transfer(owner, token.balanceOf(this));
  }

  function finalize()
  public onlyOwner ensureStarted
  {
    finalized = true;
  }

  function updateDistributed(uint amountChanged)
  public onlyDistributionUpdater
  {
    distributed = distributed.add(amountChanged);
  }


  // PRIVATE

  bool finalized;

  function calculatePurchased()
  private returns (uint)
  {
    uint start = startTime;
    if (block.timestamp <= start + phase1End) {
      return msg.value.mul(200).div(10**8);
    } else if (block.timestamp <= start + phase2End) {
      return msg.value.mul(175).div(10**8);
    } else if (block.timestamp <= start + phase3End) {
      return msg.value.mul(165).div(10**8);
    } else if (block.timestamp <= start + phase4End) {
      return msg.value.mul(155).div(10**8);
    } else {
      return msg.value.mul(145).div(10**8);
    }
  }

  function started()
  private returns (bool)
  {
    return block.timestamp >= startTime;
  }

  function ended()
  private returns (bool)
  {
    return block.timestamp > startTime + endTime;
  }

  function funded()
  private returns (bool)
  {
    return distributed == limit;
  }

  function underLimit(uint _purchasedAmount)
  private returns (bool)
  {
    return (_purchasedAmount + distributed <= limit);
  }


  // MODIFIERS

  modifier ensureStarted()
  {
    require(started());
    _;
  }

  modifier ensureNotCompleted()
  {
    require(!completed());
    _;
  }

  modifier ensureCompleted()
  {
    require(completed());
    _;
  }

  modifier onlyDistributionUpdater()
  {
    require(msg.sender == distributionUpdater);
    _;
  }

}
