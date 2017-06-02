require('./support/helpers.js');

contract('TokenSale', () => {
  let limit, sale, owner, recipient;

  before(() => {
    owner = Accounts[0];
    recipient = Accounts[1];
    limit = 1000000;
    startTime = unixTime("2020-06-01T00:00:00.000");

    return TokenSale.new(recipient, limit, startTime, {from: owner})
      .then(response => sale = response);
  });

  describe("initialization", () => {
    it("sets the initial limit of the token sale", () => {
      return sale.fundingLimit.call().then(fundingLimit => {
        assert.equal(limit.toString(), fundingLimit.toString());
      });
    });

    it("sets the recipient of the funds", () => {
      return sale.recipient.call().then(fundingRecipient => {
        assert.equal(recipient, fundingRecipient);
      });
    });

    it("sets the start date of the contract", () => {
      return sale.startTime.call().then(fundingStart => {
        assert.equal(startTime.toString(), fundingStart.toString());
      });
    });

    it("sets the end of phase one as a week after the start time", () => {
      return sale.phaseOneEnd.call().then(phaseTwo => {
        let expected = startTime + days(7);
        assert.equal(expected.toString(), phaseTwo.toString());
      });
    });

    it("sets the end of phase two as two weeks after the start time", () => {
      return sale.phaseTwoEnd.call().then(phaseThree => {
        let expected = startTime + days(14);
        assert.equal(expected.toString(), phaseThree.toString());
      });
    });

    it("sets the end of phase three as four weeks after the start time", () => {
      return sale.phaseThreeEnd.call().then(fundingEnd => {
        let expected = startTime + days(28);
        assert.equal(expected.toString(), fundingEnd.toString());
      });
    });
  });
});
