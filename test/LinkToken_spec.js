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
      'balanceOf',
      'transfer',
      'transferFrom',
    ];

    checkPublicABI(LinkToken, expectedABI);
  });

  it("assigns all of the balance to the owner", async () => {
    let balance = await token.balanceOf.call(owner);

    assert.equal(balance.toString(), bigNum(10**18).toString());
  });

  describe("#transfer(address,uint256)", () => {
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

  describe("#transfer(address,uint256,bytes)", () => {
    let value = 1000;

    beforeEach(async () => {
      recipient = await LinkReceiver.new({from: owner});

      assert.equal(await token.allowance.call(owner, recipient.address), 0);
      assert.equal(await token.balanceOf.call(recipient.address), 0);
    });

    it("transfers the amount to the contract and calls the contract", async () => {
      let data = "be45fd62" + // transfer(address,uint256,bytes)
        encodeAddress(recipient.address) +
        encodeUint256(value) +
        encodeUint256(96) +
        encodeBytes("fce929c3"); // callbackWithoutWithdrawl(address,address,uint256)

      await sendTransaction({
        from: owner,
        to: token.address,
        data: data,
      });

      assert.equal(await token.balanceOf.call(recipient.address), value);
      assert.equal(await token.allowance.call(owner, recipient.address), 0);
      // assert.equal(await recipient.lastTransferSender.call(), owner);
      // assert.equal(await recipient.lastTransferAmount.call(), value);
      assert.equal(await recipient.fallbackCalled.call(), true);
      assert.equal(await recipient.callDataCalled.call(), true);
    });

    it("does not blow up if no data is passed", async () => {
      let data = "be45fd62" + // transfer(address,uint256,bytes)
        encodeAddress(recipient.address) +
        encodeUint256(value) +
        encodeUint256(96) +
        encodeBytes("");

      await sendTransaction({
        from: owner,
        to: token.address,
        data: data,
      });

      assert.equal(await recipient.fallbackCalled.call(), true);
      assert.equal(await recipient.callDataCalled.call(), false);
    });
  });
});
