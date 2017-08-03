require('./support/helpers.js');

contract('SmartOracle', () => {
  let SmartOracle = artifacts.require("./contracts/SmartOracle.sol");
  let oracle, owner;

  before(async () => {
    owner = Accounts[0];
    oracle = await SmartOracle.new({from: owner});
  });

  it("sets the deployer as the contract owner", async () => {
    oracleOwner = await oracle.owner.call();

    assert.equal(owner, oracleOwner);
  });
});
