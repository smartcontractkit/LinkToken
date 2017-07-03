require('./support/helpers.js');

contract('LinkToken', () => {
  let LinkToken = artifacts.require("./contracts/LinkToken.sol");
  let link, owner;

  before(async () => {
    owner = Accounts[0];
    link = await LinkToken.new({from: owner});
  });

  it("assigns all of the balance to the owner", async () => {
    let balance = await link.balanceOf.call(owner);

    assert.equal(balance.toString(), bigNum(10**18).toString());
  });
});
