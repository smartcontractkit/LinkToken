pragma solidity ^0.4.8;

import './Ownable.sol';
import './SafeMath.sol';
import './LinkToken.sol';

contract TokenSale is Ownable {
  using SafeMath for uint;

  uint public limit;
  uint public startTime;
  uint public distributed;
  uint public phaseOneEnd;
  uint public phaseTwoEnd;
  uint public endTime;
  address public recipient;
  LinkToken public token;

  function TokenSale(
    uint _limit,
    uint _start
  ) {
    limit = _limit;
    startTime = _start;
    phaseOneEnd = _start + 1 weeks;
    phaseTwoEnd = _start + 2 weeks;
    endTime = _start + 4 weeks;
    token = new LinkToken();

    if (limit > token.totalSupply()) throw;
  }

  function ()
  payable ensureStarted ensureNotEnded underLimit {
    if (owner.send(msg.value)) {
      distributed += msg.value;
      token.transfer(msg.sender, purchased());
    }
  }

  function closeOut()
  onlyOwner ensureStarted ensureCompleted {
    token.transfer(owner, token.balanceOf(this));
  }


  // PRIVATE

  function purchased()
  private returns (uint) {
    if (block.timestamp <= phaseOneEnd) {
      return msg.value.div(10**15);
    } else if (block.timestamp <= phaseTwoEnd) {
      return msg.value.mul(75).div(10**17);
    } else {
      return msg.value.mul(50).div(10**17);
    }
  }

  function started()
  private returns (bool) {
    return block.timestamp >= startTime;
  }

  function ended()
  private returns (bool) {
    return block.timestamp > endTime;
  }

  function funded()
  private returns (bool) {
    return distributed == limit;
  }

  function completed()
  private returns (bool) {
    return ended() || funded();
  }


  // MODIFIERS

  modifier ensureStarted() {
    if (!started()) throw; _;
  }

  modifier ensureNotEnded() {
    if (ended()) throw; _;
  }

  modifier ensureCompleted() {
    if (!completed()) throw; _;
  }

  modifier underLimit() {
    if (purchased() + distributed > limit) throw; _;
  }

}
