'use strict';

require('./support/helpers.js');

contract('LinkToken', () => {
  let LinkToken = artifacts.require("./contracts/LinkToken.sol");
  let LinkReceiver = artifacts.require("./contracts/mocks/LinkReceiver.sol");
  let allowance, owner, recipient, token;

  beforeEach(async () => {
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
      'decreaseApproval',
      'increaseApproval',
      'transfer',
      'transferFrom',
    ];

    checkPublicABI(LinkToken, expectedABI);
  });

  it("assigns all of the balance to the owner", async () => {
    let balance = await token.balanceOf.call(owner);

    assert.equal(balance.toString(), '1e+27');
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

    it("does not let you transfer to an empty address", async () => {
      await assertActionThrows(async () => {
        let data = "be45fd62" + // transfer(address,uint256,bytes)
          encodeAddress(token.address) +
          encodeUint256(value) +
          encodeUint256(96) +
          encodeBytes("");

        await sendTransaction({
          from: owner,
          to: token.address,
          data: data,
        });
      });
    });

    it("does not let you transfer to the contract itself", async () => {
      await assertActionThrows(async () => {
        let data = "be45fd62" + // transfer(address,uint256,bytes)
          encodeAddress(emptyAddress) +
          encodeUint256(value) +
          encodeUint256(96) +
          encodeBytes("");

        await sendTransaction({
          from: owner,
          to: token.address,
          data: data,
        });
      });
    });

    it("transfers the amount to the contract and calls the contract", async () => {
      let data = "be45fd62" + // transfer(address,uint256,bytes)
        encodeAddress(recipient.address) +
        encodeUint256(value) +
        encodeUint256(96) +
        encodeBytes("043e94bd"); // callbackWithoutWithdrawl()

      await sendTransaction({
        from: owner,
        to: token.address,
        data: data,
      });

      assert.equal(await token.balanceOf.call(recipient.address), value);
      assert.equal(await token.allowance.call(owner, recipient.address), 0);
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

  describe("#approve", () => {
    it("allows token approval amounts to be updated without first resetting to zero", async () => {
      let originalApproval = bigNum(1000);
      await token.approve(recipient, originalApproval, {from: owner});
      let approvedAmount = await token.allowance.call(owner, recipient);
      assert.equal(approvedAmount.toString(), originalApproval.toString());

      let laterApproval = bigNum(2000);
      await token.approve(recipient, laterApproval, {from: owner});
      approvedAmount = await token.allowance.call(owner, recipient);
      assert.equal(approvedAmount.toString(), laterApproval.toString());
    });
  });
});
