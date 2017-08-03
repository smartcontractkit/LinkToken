pragma solidity ^0.4.8;

import "truffle/Assert.sol";
import "../contracts/mocks/Token223.sol";
import "../contracts/mocks/Token223ReceiverMock.sol";

contract Standard223TokenReceiverTest {
    Token223 token;
    Token223ReceiverMock receiver;

    function beforeEach() {
        token = new Token223(100);
        receiver = new Token223ReceiverMock();
    }

    function testFallbackIsCalledOnTransfer() {
        token.transfer(receiver, 10);

        Assert.equal(receiver.tokenSender(), this, 'Sender should be correct');
        Assert.equal(receiver.sentValue(), 10, 'Value should be correct');
    }

    function testCorrectFunctionIsCalledOnTransfer() {
        bytes memory data = new bytes(4);
        token.transfer(receiver, 20, data);

        Assert.isTrue(receiver.calledFallback(), 'Should have called foo');
    }
}
