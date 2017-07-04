pragma solidity ^0.4.8;

import './Ownable.sol';
import './SafeMath.sol';
import './LinkToken.sol';

contract TokenSale is Ownable {
  using SafeMath for uint;

  uint public fundingLimit;
  uint public startTime;
  uint public fundingReceived;
  uint public phaseOneEnd;
  uint public phaseTwoEnd;
  uint public endTime;
  address public recipient;
  LinkToken public token;

  event Purchase(address purchaser, uint paid, uint received);

  function TokenSale(
    address _recipient,
    uint _limit,
    uint _start
  ) {
    fundingLimit = _limit;
    recipient = _recipient;
    startTime = _start;
    phaseOneEnd = _start + 1 weeks;
    phaseTwoEnd = _start + 2 weeks;
    endTime = _start + 4 weeks;
    token = new LinkToken();
  }

  function ()
  payable ensureStarted {
    bool underLimit = msg.value + fundingReceived <= fundingLimit;
    if (underLimit && recipient.send(msg.value)) {
      fundingReceived += msg.value;
      token.transfer(msg.sender, amountReceived());
    } else {
      throw;
    }
  }


  // PRIVATE

  function amountReceived()
  private returns (uint) {
    if (block.timestamp <= phaseOneEnd) {
      return msg.value.div(10**15);
    } else if (block.timestamp <= phaseTwoEnd) {
      return msg.value.mul(75).div(10**17);
    } else {
      return msg.value.mul(50).div(10**17);
    }
  }


  // MODIFIERS

  modifier ensureStarted() {
    if (block.timestamp < startTime || block.timestamp > endTime) {
      throw;
    } else {
      _;
    }
  }

}
