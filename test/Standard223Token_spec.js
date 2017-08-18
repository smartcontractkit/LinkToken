require('./support/helpers.js')

contract('Standard223Token', (accounts) => {
  let Token223 = artifacts.require("../contracts/mocks/Token223.sol");
  let Token223ReceiverMock = artifacts.require("../contracts/mocks/Token223ReceiverMock.sol");

  let receiver, token;

  beforeEach(async function() {
    receiver = await Token223ReceiverMock.new();
    token = await Token223.new(1000);
    assert.equal(await receiver.sentValue(), 0);
  });

  describe("#transfer(address, uint)", () => {
    it("calls the fallback on transfer", async () => {
      await token.transfer(receiver.address, 100);

      let tokenSender = await receiver.tokenSender();
      assert.equal(tokenSender, accounts[0]);

      let sentValue = await receiver.sentValue();
      assert.equal(sentValue, 100);

      let calledFallback = await receiver.calledFallback();
      assert(calledFallback);
    });

    context("when sending to a contract that is not ERC223 compatible", () => {
      it("throws an error", async () => {
        await assertActionThrows(async () => {
          await token.transfer(token.address, 100);
        });
      });
    });
  });

  describe("#transfer(address, uint, bytes)", () => {
    it("calls the correct function on transfer", async () => {
      await token.transfer(receiver.address, 100, "0xdeadbeef", {});

      let tokenSender = await receiver.tokenSender();
      assert.equal(tokenSender, accounts[0]);

      let sentValue = await receiver.sentValue();
      assert.equal(sentValue, 100);

      let calledFallback = await receiver.calledFallback();
      assert(calledFallback);
    });

    context("when sending to a contract that is not ERC223 compatible", () => {
      it("throws an error", async () => {
        await assertActionThrows(async () => {
          await token.transfer(token.address, 100, "0xdeadbeef", {});
        });
      });
    });
  });
});
