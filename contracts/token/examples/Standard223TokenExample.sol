pragma solidity ^0.4.11;


import "../Standard223Token.sol";


contract Standard223TokenExample is Standard223Token {
    string public constant name = "Example ERC223 Token";
    string public constant symbol = "ERC223";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    function Standard223TokenExample(uint _initialBalance)
    {
        balances[msg.sender] = _initialBalance;
        totalSupply = _initialBalance;
    }
}
