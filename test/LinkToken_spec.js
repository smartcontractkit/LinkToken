'use strict';

require('./support/helpers.js');

contract('LinkToken', () => {
  let LinkToken = artifacts.require("./contracts/LinkToken.sol");
  let LinkReceiver = artifacts.require("./contracts/mocks/LinkReceiver.sol");
  let allowance, owner, recipient, token;

  before(async () => {
    owner = Accounts[0];
    recipient = Accounts[1];
    token = await LinkToken.new({from: owner});
  });

  it("assigns all of the balance to the owner", async () => {
    let balance = await token.balanceOf.call(owner);

    assert.equal(balance.toString(), bigNum(10**18).toString());
  });

  describe("#transfer", () => {
    it("does not let you transfer to an empty address", async () => {
      await assertActionThrows(async () => {
        await token.transfer(emptyAddress, 1000, {from: owner});
      });
    });

    it("does not let you transfer to the contract itself", async () => {
      await assertActionThrows(async () => {
        await token.transfer(token.address, 1000, {from: owner});
      });
    });
  });

  describe("#approveAndCall", () => {
    let value = 1000;

    beforeEach(async () => {
      recipient = await LinkReceiver.new({from: owner});

      allowance = await token.allowance.call(owner, recipient.address);
      assert.equal(allowance, 0);
    });

    it("sets the approved withdrawl amount", async () => {
      let callNoWithdrawl = "0x043e94bd";   // callbackWithoutWithdrawl()
      await token.approveAndCall(recipient.address, value, callNoWithdrawl, {from: owner});

      allowance = await token.allowance(owner, recipient.address);
      assert.equal(allowance, value);

      let balance = await token.balanceOf(recipient.address);
      assert.equal(balance, 0);

      let called = await recipient.callbackCalled.call();
      assert.equal(called, true);
    });

    it("calls the specified contract and allows it to withdraw", async () => {
      let callAndWithdrawl = "0x025ca895";  // callbackWithWithdrawl(uint256)
      let data = callAndWithdrawl + encodeUint256(value);
      await token.approveAndCall(recipient.address, value, data, {from: owner});

      allowance = await token.allowance(owner, recipient.address);
      assert.equal(allowance, 0);

      let balance = await token.balanceOf(recipient.address);
      assert.equal(balance, value);

      let called = await recipient.callbackCalled.call();
      assert.equal(called, true);
    });
  });
});
