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

  it("has a limited public ABI", () => {
    let expectedABI = [
      //public attributes
      'decimals',
      'name',
      'symbol',
      'totalSupply',
      //public functions
      'allowance',
      'approve',
      'approveAndCall',
      'balanceOf',
      'transfer',
      'transferAndCall',
      'transferFrom',
    ];

    checkPublicABI(LinkToken, expectedABI);
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

      assert.equal(await token.allowance.call(owner, recipient.address), 0);
      assert.equal(await token.balanceOf.call(recipient.address), 0);
    });

    it("sets the approved withdrawl amount", async () => {
      let callNoWithdrawl = "0x043e94bd";   // callbackWithoutWithdrawl()
      await token.approveAndCall(recipient.address, value, callNoWithdrawl, {from: owner});

      assert.equal(await token.allowance(owner, recipient.address), value);
      assert.equal(await token.balanceOf(recipient.address), 0);
      assert.equal(await recipient.callbackCalled.call(), true);
      assert.equal(await recipient.callDataCalled.call(), true);
    });

    it("calls the specified contract and allows it to withdraw", async () => {
      let callAndWithdrawl = "0x082017ea";  // callbackWithWithdrawl(uint256,address,address)
      let data = callAndWithdrawl + encodeUint256(value) +
        encodeAddress(owner) + encodeAddress(token.address);
      await token.approveAndCall(recipient.address, value, data, {from: owner});

      assert.equal(await token.allowance(owner, recipient.address), 0);
      assert.equal(await token.balanceOf(recipient.address), value);
      assert.equal(await recipient.callbackCalled.call(), true);
      assert.equal(await recipient.callDataCalled.call(), true);
    });

    it("does not blow up if no data is passed", async () => {
      await token.approveAndCall(recipient.address, value, '', {from: owner});

      assert.equal(await token.allowance(owner, recipient.address), value);
      assert.equal(await token.balanceOf(recipient.address), 0);
      assert.equal(await recipient.callbackCalled.call(), true);
      assert.equal(await recipient.callDataCalled.call(), false);
    });
  });

  describe("#transferAndCall", () => {
    let value = 1000;

    beforeEach(async () => {
      recipient = await LinkReceiver.new({from: owner});

      assert.equal(await token.allowance.call(owner, recipient.address), 0);
      assert.equal(await token.balanceOf.call(recipient.address), 0);
    });

    it("transfers the amount to the contract and calls the contract", async () => {
      let callNoWithdrawl = "0x043e94bd";   // callbackWithoutWithdrawl()
      await token.transferAndCall(recipient.address, value, callNoWithdrawl, {from: owner});

      assert.equal(await recipient.lastTransferSender.call(), owner);
      assert.equal(await recipient.lastTransferAmount.call(), value);
      assert.equal(await token.balanceOf(recipient.address), value);
      assert.equal(await token.allowance(owner, recipient.address), 0);
      assert.equal(await recipient.callbackCalled.call(), true);
      assert.equal(await recipient.callDataCalled.call(), true);
    });

    it("does not blow up if no data is passed", async () => {
      await token.transferAndCall(recipient.address, value, '', {from: owner});

      assert.equal(await recipient.callbackCalled.call(), true);
      assert.equal(await recipient.callDataCalled.call(), false);
    });
  });
});
