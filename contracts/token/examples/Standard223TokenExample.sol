pragma solidity ^0.4.11;

import "../Standard223Token.sol";

contract Standard223TokenExample is Standard223Token {

    function Standard223TokenExample(uint _initialBalance) {
        balances[msg.sender] = _initialBalance;
        totalSupply = _initialBalance;
    }
}
