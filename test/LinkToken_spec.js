'use strict';

require('./support/helpers.js');

contract('LinkToken', () => {
  let LinkToken = artifacts.require("./contracts/LinkToken.sol");
  let token, owner;

  before(async () => {
    owner = Accounts[0];
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
});
