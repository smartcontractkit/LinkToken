pragma solidity ^0.4.8;

import "truffle/Assert.sol";
import "../contracts/token/examples/Standard223TokenExample.sol";
import "../contracts/token/mocks/Standard223TokenReceiverMock.sol";

contract Standard223TokenReceiverTest {
    Standard223TokenExample token;
    Standard223TokenReceiverMock receiver;

    function beforeEach() {
        token = new Standard223TokenExample(100);
        receiver = new Standard223TokenReceiverMock();
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
