pragma solidity ^0.4.11;


import './Ownable.sol';
import './math/SafeMath.sol';
import './LinkToken.sol';


contract TokenSale is Ownable {

  using SafeMath for uint;

  uint public limit;
  uint public startTime;
  uint public distributed;
  uint public phaseOneEnd;
  uint public phaseTwoEnd;
  uint public phaseThreeEnd;
  uint public endTime;
  address public recipient;
  LinkToken public token;

  function TokenSale(uint _limit, uint _prePurchased, uint _start, address _owner)
  public
  {
    limit = _limit;
    distributed = _prePurchased;
    startTime = _start;
    phaseOneEnd = _start + 1 days;
    phaseTwoEnd = _start + 1 weeks;
    phaseThreeEnd = _start + 2 weeks;
    endTime = _start + 4 weeks;
    token = new LinkToken();
    owner = _owner;

    require(limit <= token.totalSupply());
  }

  function ()
  public payable ensureStarted ensureNotEnded underLimit
  {
    if (owner.send(msg.value)) {
      distributed += msg.value;
      token.transfer(msg.sender, purchased());
    }
  }

  function closeOut()
  public onlyOwner ensureStarted ensureCompleted
  {
    token.transfer(owner, token.balanceOf(this));
  }


  // PRIVATE

  function purchased()
  private returns (uint)
  {
    if (block.timestamp <= phaseOneEnd) {
      return msg.value.div(10**6).mul(2);
    } else if (block.timestamp <= phaseTwoEnd) {
      return msg.value.mul(18).div(10**7);
    } else if (block.timestamp <= phaseThreeEnd) {
      return msg.value.mul(15).div(10**7);
    } else {
      return msg.value.mul(12).div(10**7);
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
    return block.timestamp > endTime;
  }

  function funded()
  private returns (bool)
  {
    return distributed == limit;
  }

  function completed()
  private returns (bool)
  {
    return ended() || funded();
  }


  // MODIFIERS

  modifier ensureStarted()
  {
    require(started());
    _;
  }

  modifier ensureNotEnded()
  {
    require(!ended());
    _;
  }

  modifier ensureCompleted()
  {
    require(completed());
    _;
  }

  modifier underLimit()
  {
    require(purchased() + distributed <= limit);
    _;
  }

}
