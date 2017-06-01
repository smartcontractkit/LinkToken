require('./support/helpers.js');

contract('TokenSale', () => {
  let limit, sale, owner, recipient;

  before(() => {
    owner = Accounts[0];
    recipient = Accounts[1];
    limit = 1000000;
    startTime = 1000000;

    return TokenSale.new(recipient, limit, startTime, {from: owner}).then(response => {
      sale = response;
    });
  });

  it("sets the initial limit of the token sale", () => {
    return sale.fundingLimit.call().then((fundingLimit) => {
      assert.equal(limit.toString(), fundingLimit.toString());
    });
  });

  it("sets the recipient of the funds", () => {
    return sale.recipient.call().then((fundingRecipient) => {
      assert.equal(recipient, fundingRecipient);
    });
  });

  it("sets the start date of the contract", () => {
    return sale.startTime.call().then((fundingStart) => {
      assert.equal(startTime.toString(), fundingStart.toString());
    });
  });
});
