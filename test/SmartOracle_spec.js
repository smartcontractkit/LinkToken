var SmartOracle = artifacts.require("./SmartOracle.sol");

contract('SmartOracle', function(accounts) {
  it("sets the deployer as the contract owner", function() {
    return SmartOracle.deployed().then(function(instance) {
      return instance.owner.call(accounts[0]);
    }).then(function(owner) {
      assert.equal(owner, accounts[0]);
    });
  });
});
