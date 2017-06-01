pragma solidity ^0.4.2;

contract TokenSale {

  uint public fundingLimit;
  uint public startTime;
  address public recipient;

  event Log(uint limit);

  function TokenSale(
    address _recipient,
    uint _limit,
    uint _start
  ) {
    Log(fundingLimit);
    fundingLimit = _limit;
    recipient = _recipient;
    startTime = _start;
  }

}
