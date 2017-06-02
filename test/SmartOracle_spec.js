require('./support/helpers.js');

contract('SmartOracle', () => {
  let oracle, owner;

  before(() => {
    owner = Accounts[0];

    return SmartOracle.new({from: owner}).then(deployed => {
      oracle = deployed;
    });
  });

  it("sets the deployer as the contract owner", () => {
    oracle.owner.call().then((oracleOwner) => {
      assert.equal(owner, accounts[0]);
    });
  });
});
